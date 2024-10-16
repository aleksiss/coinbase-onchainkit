import { cn } from '../../styles/theme';
import { useIsMounted } from '../../useIsMounted';
import { useTheme } from '../../useTheme';
import type { PayReact } from '../types';
import { PayProvider } from './PayProvider';

export function Pay({
  chargeHandler,
  children,
  className,
  isSponsored,
  onStatus,
  productId,
}: PayReact) {
  const isMounted = useIsMounted();
  const componentTheme = useTheme();
  // prevents SSR hydration issue
  if (!isMounted) {
    return null;
  }

  return (
    <PayProvider
      chargeHandler={chargeHandler}
      isSponsored={isSponsored}
      onStatus={onStatus}
      productId={productId}
    >
      <div
        className={cn(componentTheme, 'flex w-full flex-col gap-2', className)}
      >
        {children}
      </div>
    </PayProvider>
  );
}
