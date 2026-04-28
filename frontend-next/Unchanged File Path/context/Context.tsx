import type { Context } from 'react'
import { React } from '../frontend/node_modules/react-redux/src/utils/react'
import type { Action, Store, UnknownAction } from 'redux'
import type { Subscription } from '../frontend/node_modules/react-redux/src/utils/Subscription'
import type { ProviderProps } from '../frontend/node_modules/react-redux/src/components/Provider'

export interface ReactReduxContextValue<
  SS = any,
  A extends Action<string> = UnknownAction,
> extends Pick<ProviderProps, 'stabilityCheck' | 'identityFunctionCheck'> {
  store: Store<SS, A>
  subscription: Subscription
  getServerState?: () => SS
}

const ContextKey = /* @__PURE__ */ Symbol.for(`react-redux-context`)
const gT: {
  [ContextKey]?: Map<
    typeof React.createContext,
    Context<ReactReduxContextValue | null>
  >
} = (
  typeof globalThis !== 'undefined'
    ? globalThis
    : /* fall back to a per-module scope (pre-8.1 behaviour) if `globalThis` is not available */ {}
) as any

function getContext(): Context<ReactReduxContextValue | null> {
  if (!React.createContext) return {} as any

  const contextMap = (gT[ContextKey] ??= new Map<
    typeof React.createContext,
    Context<ReactReduxContextValue | null>
  >())
  let realContext = contextMap.get(React.createContext)
  if (!realContext) {
    realContext = React.createContext<ReactReduxContextValue | null>(
      null as any,
    )
    if (process.env.NODE_ENV !== 'production') {
      realContext.displayName = 'ReactRedux'
    }
    contextMap.set(React.createContext, realContext)
  }
  return realContext
}

export const ReactReduxContext = /*#__PURE__*/ getContext()

export type ReactReduxContextInstance = typeof ReactReduxContext
