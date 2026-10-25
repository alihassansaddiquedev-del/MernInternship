import type { CartAction } from './Cart';

export function createActionHandler(dispatch: (action: CartAction) => void) {
  return (action: CartAction): void => dispatch(action);
}

export type ActionHandler = ReturnType<typeof createActionHandler>;
export type HandlerResult<T> = T extends (...args: never[]) => infer Result ? Result : never;
export type ActionHandlerResult = HandlerResult<ActionHandler>;
