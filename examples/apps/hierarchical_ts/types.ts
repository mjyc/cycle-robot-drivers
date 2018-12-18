export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type ReducerState<S, V, O> = {
  state: S
  variables: V,
  outputs: O,
};