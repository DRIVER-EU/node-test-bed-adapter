declare interface PromiseConstructor {
  map<T, U>(
    iterable: Iterable<T>,
    mapper: (value: T, index: number) => U | Promise<U>,
    options?: { concurrency?: number }
  ): Promise<U[]>;
}
