export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type ReducerStateTemplate<S, V, O> = {
  state: S
  variables: V,
  outputs: O,
};