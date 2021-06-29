/**
 * this is the main entry-point for custom builds
 * it can be used as standalone but is also used in the batteries-included main-export
 */

import './types/modules/crypto-js.d';
import './types/modules/graphql-client.d';
import './types/modules/mocha.parallel.d';
import './types/modules/modifiyjs.d';
import './types/modules/pouchdb-selector-core.d';
import './types/modules/random-token.d';



export { addRxPlugin } from './plugin';
export {
    PouchDB,
    validateCouchDBString,
    getBatch,
    countAllUndeleted,
    getNewestSequence
} from './pouch-db';

export {
    createRxDatabase,
    removeRxDatabase,
    checkAdapter,
    isInstanceOf as isRxDatabase,
    dbCount,
    _collectionNamePrimary // used in tests
} from './rx-database';

export {
    isInstanceOf as isRxCollection,
    create as _createRxCollection // used in tests
} from './rx-collection';

export {
    isInstanceOf as isRxDocument
} from './rx-document';

export {
    getDocumentOrmPrototype,
    getDocumentPrototype
} from './rx-document-prototype-merge';

export {
    isInstanceOf as isRxQuery
} from './rx-query';

export {
    isInstanceOf as isRxSchema,
    createRxSchema,
    RxSchema,
    getIndexes,
    normalize,
    getFinalFields,
    getPreviousVersions
} from './rx-schema';

export {
    RxChangeEvent
} from './rx-change-event';

export {
    getRxStoragePouchDb,
    getPouchLocation
} from './rx-storage-pouchdb';

export {
    _clearHook // used in tests
} from './hooks';

export {
    createCrypter // used in tests
} from './crypter';

export * from './query-cache';

export type {
    RxStorage
} from './rx-storate.interface';


export * from './util';

export * from './types';
