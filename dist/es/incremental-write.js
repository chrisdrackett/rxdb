import { isBulkWriteConflictError, rxStorageWriteErrorToRxError } from './rx-error';
import { clone, ensureNotFalsy, getFromMapOrFill, getFromMapOrThrow, parseRevision, stripMetaDataFromDocument } from './plugins/utils';
/**
 * The incremental write queue
 * batches up all incremental writes to a collection
 * so that performance can be improved by:
 * - Running only one write even when there are multiple modifications to the same document.
 * - Run all writes ins a single bulkWrite() call even when there are writes to many documents.
 */
export var IncrementalWriteQueue = /*#__PURE__*/function () {
  function IncrementalWriteQueue(storageInstance, primaryPath,
  // can be used to run hooks etc.
  preWrite, postWrite) {
    this.queueByDocId = new Map();
    this.isRunning = false;
    this.storageInstance = storageInstance;
    this.primaryPath = primaryPath;
    this.preWrite = preWrite;
    this.postWrite = postWrite;
  }
  var _proto = IncrementalWriteQueue.prototype;
  _proto.addWrite = function addWrite(lastKnownDocumentState, modifier) {
    var docId = lastKnownDocumentState[this.primaryPath];
    var ar = getFromMapOrFill(this.queueByDocId, docId, () => []);
    var ret = new Promise((resolve, reject) => {
      var item = {
        lastKnownDocumentState,
        modifier,
        resolve,
        reject
      };
      ensureNotFalsy(ar).push(item);
      this.triggerRun();
    });
    return ret;
  };
  _proto.triggerRun = async function triggerRun() {
    if (this.isRunning === true || this.queueByDocId.size === 0) {
      // already running
      return;
    }
    this.isRunning = true;
    var writeRows = [];

    /**
     * 'take over' so that while the async functions runs,
     * new incremental updates could be added from the outside.
     */
    var itemsById = this.queueByDocId;
    this.queueByDocId = new Map();
    await Promise.all(Array.from(itemsById.entries()).map(async ([_docId, items]) => {
      var oldData = findNewestOfDocumentStates(items.map(i => i.lastKnownDocumentState));
      var newData = oldData;
      for (var item of items) {
        try {
          newData = await item.modifier(
          /**
           * We have to clone() each time because the modifier
           * might throw while it already changed some properties
           * of the document.
           */
          clone(newData));
        } catch (err) {
          item.reject(err);
          item.reject = () => {};
          item.resolve = () => {};
        }
      }
      try {
        await this.preWrite(newData, oldData);
      } catch (err) {
        /**
         * If the before-hooks fail,
         * we reject all of the writes because it is
         * not possible to determine which one is to blame.
         */
        items.forEach(item => item.reject(err));
        return;
      }
      writeRows.push({
        previous: oldData,
        document: newData
      });
    }));
    var writeResult = writeRows.length > 0 ? await this.storageInstance.bulkWrite(writeRows, 'incremental-write') : {
      error: {},
      success: {}
    };

    // process success
    await Promise.all(Array.from(Object.entries(writeResult.success)).map(([docId, result]) => {
      this.postWrite(result);
      var items = getFromMapOrThrow(itemsById, docId);
      items.forEach(item => item.resolve(result));
    }));

    // process errors
    Array.from(Object.entries(writeResult.error)).forEach(([docId, error]) => {
      var items = getFromMapOrThrow(itemsById, docId);
      var isConflict = isBulkWriteConflictError(error);
      if (isConflict) {
        // had conflict -> retry afterwards
        var ar = getFromMapOrFill(this.queueByDocId, docId, () => []);
        /**
         * Add the items back to this.queueByDocId
         * by maintaining the original order.
         */
        items.reverse().forEach(item => {
          item.lastKnownDocumentState = ensureNotFalsy(isConflict.documentInDb);
          ensureNotFalsy(ar).unshift(item);
        });
      } else {
        // other error -> must be thrown
        var rxError = rxStorageWriteErrorToRxError(error);
        items.forEach(item => item.reject(rxError));
      }
    });
    this.isRunning = false;

    /**
     * Always trigger another run
     * because in between there might be new items
     * been added to the queue.
     */
    return this.triggerRun();
  };
  return IncrementalWriteQueue;
}();
export function modifierFromPublicToInternal(publicModifier) {
  var ret = async docData => {
    var withoutMeta = stripMetaDataFromDocument(docData);
    withoutMeta._deleted = docData._deleted;
    var modified = await publicModifier(withoutMeta);
    var reattachedMeta = Object.assign({}, modified, {
      _meta: docData._meta,
      _attachments: docData._attachments,
      _rev: docData._rev,
      _deleted: typeof modified._deleted !== 'undefined' ? modified._deleted : docData._deleted
    });
    if (typeof reattachedMeta._deleted === 'undefined') {
      reattachedMeta._deleted = false;
    }
    return reattachedMeta;
  };
  return ret;
}
export function findNewestOfDocumentStates(docs) {
  var newest = docs[0];
  var newestRevisionHeight = parseRevision(newest._rev).height;
  docs.forEach(doc => {
    var height = parseRevision(doc._rev).height;
    if (height > newestRevisionHeight) {
      newest = doc;
      newestRevisionHeight = height;
    }
  });
  return newest;
}
//# sourceMappingURL=incremental-write.js.map