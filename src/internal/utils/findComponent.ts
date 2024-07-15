import {
  type ComponentType,
  type ReactElement,
  type ReactNode,
  isValidElement,
} from 'react';

export function findComponent<T>(component: ComponentType<T>) {
  return (child: ReactNode): child is ReactElement<T> => {
    return isValidElement(child) && child.type === component;
  };
}
