import { type IObservableValue, observable, runInAction } from "mobx";

export type PromiseState<T> =
  | { readonly status: "pending" }
  | { readonly status: "fulfilled"; readonly value: T }
  | { readonly status: "rejected"; readonly error: unknown };

const states = new WeakMap<Promise<unknown>, IObservableValue<PromiseState<unknown>>>();

// Follows a promise as observable state, so an observer renders it without suspending.
export const promiseState = <T>(promise: Promise<T>): PromiseState<T> => {
  let state = states.get(promise);

  if (!state) {
    const box = observable.box<PromiseState<unknown>>({ status: "pending" }, { deep: false });

    promise.then(
      (value) => runInAction(() => box.set({ status: "fulfilled", value })),
      (error: unknown) => runInAction(() => box.set({ status: "rejected", error })),
    );

    states.set(promise, box);
    state = box;
  }

  return state.get() as PromiseState<T>;
};
