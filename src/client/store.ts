/**
 * 极小的外部 store + React 绑定。
 *
 * 为什么不用 `@deepseek-ai/dsh-client-store`：本仓库没装这个包（它由平台模块表在运行时提供）。
 * 我们只需要 `getSnapshot/subscribe` 这一对，用 React 18 自带的 `useSyncExternalStore` 即可。
 */

import { useSyncExternalStore } from 'react'

/** 一个不可变值 + 订阅者集合 */
export class Store<T> {
  private value: T
  private readonly listeners = new Set<() => void>()

  constructor(initial: T) {
    this.value = initial
  }

  /** 当前值（引用稳定，直到下一次 set） */
  readonly getSnapshot = (): T => this.value

  /** 订阅；返回退订函数 */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** 写入新值（同一个引用直接忽略，避免无谓重渲染） */
  set(next: T): void {
    if (next === this.value) return
    this.value = next
    for (const listener of [...this.listeners]) {
      try {
        listener()
      } catch {
        // 订阅者抛错不能拖垮其他订阅者，也不能把异常文本写进日志
      }
    }
  }
}

/** 订阅 store 的 React hook */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
