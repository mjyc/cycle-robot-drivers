export type FSMReducerState<S, V, O> = {
  state: S
  variables: V,
  outputs: O,
};