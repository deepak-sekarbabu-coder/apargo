// Database abstraction interfaces for Dependency Inversion Principle
// These interfaces allow us to decouple from specific database implementations

export interface DocumentData {
  [key: string]: any;
}

export interface DocumentSnapshot<T = DocumentData> {
  id: string;
  exists: boolean;
  data(): T | undefined;
}

export interface QuerySnapshot<T = DocumentData> {
  empty: boolean;
  docs: DocumentSnapshot<T>[];
}

export interface DocumentReference<T = DocumentData> {
  id: string;
  get(): Promise<DocumentSnapshot<T>>;
  set(data: T): Promise<void>;
  update(data: Partial<T>): Promise<void>;
  delete(): Promise<void>;
}

export interface Query<T = DocumentData> {
  get(): Promise<QuerySnapshot<T>>;
}

export interface WhereFilter {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any';
  value: any;
}

export interface QueryBuilder<T = DocumentData> {
  where(filter: WhereFilter): QueryBuilder<T>;
  get(): Promise<QuerySnapshot<T>>;
}

export interface CollectionReference<T = DocumentData> {
  doc(id?: string): DocumentReference<T>;
  add(data: T): Promise<DocumentReference<T>>;
  query(): QueryBuilder<T>;
}

export interface Subscription {
  unsubscribe(): void;
}

export interface DatabaseService {
  collection<T = DocumentData>(name: string): CollectionReference<T>;
  subscribeToCollection<T = DocumentData>(
    collectionName: string,
    callback: (snapshot: QuerySnapshot<T>) => void,
    filters?: WhereFilter[]
  ): Subscription;
}
