export function createActionHandler<Action>(dispatch: (action: Action) => void) {
  return (action: Action): void => dispatch(action);
}

export type ActionHandler<Action> = ReturnType<typeof createActionHandler<Action>>;
export type HandlerResult<T> = T extends (...args: never[]) => infer Result ? Result : never;
export type CartActionHandler = ActionHandler<import('./Cart').CartAction>;
export type ActionHandlerResult = HandlerResult<CartActionHandler>;
