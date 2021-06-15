import {
    MigrationState,
    RxCollection,
    RxDumpCollection,
    RxDumpCollectionAsAny
} from './rx-collection';
import {
    RxLocalDocument
} from './rx-document';
import {
    RxDatabaseBase
} from '../rx-database';
import { Observable } from 'rxjs';
import { RxStorage } from './rx-storage.interface';
import { PouchDBExpressServerOptions } from './plugins/server';

export interface RxDatabaseCreator<Internals, InstanceCreationOptions> {
    storage: RxStorage<Internals, InstanceCreationOptions>,
    instanceCreationOptions?: InstanceCreationOptions;
    name: string;
    password?: string | any;
    multiInstance?: boolean;
    eventReduce?: boolean;
    ignoreDuplicate?: boolean;
    options?: any;
}

// options for the server-plugin
export interface ServerOptions {
    path?: string;
    port?: number;
    cors?: boolean;
    startServer?: boolean;
    pouchdbExpressOptions?: PouchDBExpressServerOptions;
}

export type CollectionsOfDatabase = { [key: string]: RxCollection };
export type RxDatabase<
    Internals = any,
    InstanceCreationOptions = any,
    Collections = CollectionsOfDatabase
    > = RxDatabaseBase<
        Internals,
        InstanceCreationOptions,
        Collections
    > &
    Collections & RxDatabaseGenerated<Collections>;

export type AllMigrationStates = {
    collection: RxCollection;
    state: MigrationState;
}[];

export interface RxLocalDocumentMutation<StorageType> {
    insertLocal<LocalDocType = any>(id: string, data: LocalDocType): Promise<
        RxLocalDocument<StorageType, LocalDocType>
    >;
    upsertLocal<LocalDocType = any>(id: string, data: LocalDocType): Promise<
        RxLocalDocument<StorageType, LocalDocType>
    >;
    getLocal<LocalDocType = any>(id: string): Promise<
        RxLocalDocument<StorageType, LocalDocType>
    >;
    getLocal$<LocalDocType = any>(id: string): Observable<
        RxLocalDocument<StorageType, LocalDocType> | null
    >;
}

export interface RxDatabaseGenerated<Collections> extends RxLocalDocumentMutation<RxDatabase<Collections>> { }

/**
 * Extract the **DocumentType** of a collection.
 */
type ExtractDTcol<P> = P extends RxCollection<infer T> ? T : { [prop: string]: any };

interface RxDumpDatabaseBase {
    encrypted: boolean;
    instanceToken: string;
    name: string;
    passwordHash: string | null;
}
export interface RxDumpDatabase<Col> extends RxDumpDatabaseBase {
    collections: RxDumpCollection<ExtractDTcol<Col[keyof Col]>>[];
}
/**
 * All base properties are typed as any because they can be encrypted.
 */
export interface RxDumpDatabaseAny<Col> extends RxDumpDatabaseBase {
    collections: RxDumpCollection<RxDumpCollectionAsAny<ExtractDTcol<Col[keyof Col]>>>[];
}
