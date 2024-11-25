import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnect, useConnectors } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';
import { closeSvg } from '../../internal/svg/closeSvg';
import { coinbaseWalletSvg } from '../../internal/svg/coinbaseWalletSvg';
import { defaultAvatarSVG } from '../../internal/svg/defaultAvatarSVG';
import { walletConnectSvg } from '../../internal/svg/walletConnectSvg';
import {
  background,
  border,
  cn,
  color,
  line,
  pressable,
  text,
} from '../../styles/theme';
import { useOnchainKit } from '../../useOnchainKit';

type WalletModalProps = {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  onError?: (error: Error) => void;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ignore
export function WalletModal({
  isOpen,
  onClose,
  className,
  onError,
}: WalletModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { config } = useOnchainKit();

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Handle focus trap and keyboard interactions
  useEffect(() => {
    if (!isOpen || !modalRef.current) {
      return;
    }

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        } else if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const appLogo = config?.appearance?.logo;
  const appName = config?.appearance?.name;
  const privacyPolicyUrl = config?.wallet?.privacyUrl ?? undefined;
  const termsOfServiceUrl = config?.wallet?.termsUrl ?? undefined;

  const handleCoinbaseWalletConnection = useCallback(() => {
    try {
      const cbConnector = coinbaseWallet({
        preference: 'all',
      });

      connect({ connector: cbConnector });
      onClose();
    } catch (error) {
      console.error('Coinbase Wallet connection error:', error);
      if (onError) {
        onError(
          error instanceof Error
            ? error
            : new Error('Failed to connect wallet'),
        );
      }
    }
  }, [connect, onClose, onError]);

  const handleWalletConnectConnector = useCallback(() => {
    try {
      const walletConnectConnector = connectors.find(
        (c) => c.type === 'walletConnect',
      );
      if (!walletConnectConnector) {
        console.error('WalletConnect connector not configured');
        return;
      }
      connect({ connector: walletConnectConnector });
      onClose();
    } catch (error) {
      console.error('WalletConnect connection error:', error);
    }
  }, [connect, connectors, onClose]);

  const handleLinkKeyDown = (
    event: React.KeyboardEvent<HTMLAnchorElement>,
    url: string,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/70 transition-opacity duration-200',
        isOpen ? 'opacity-100' : 'opacity-0',
        className,
      )}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Enter' && onClose()}
      role="presentation"
      data-testid="ockModalOverlay"
    >
      <div
        ref={modalRef}
        className={cn(
          border.default,
          border.radius,
          background.default,
          line.default,
          'w-[323px] p-6 pb-4',
          'flex flex-col gap-4',
          'relative',
          '-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2',
          'transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4',
            'flex items-center justify-center',
            'h-3 w-3',
          )}
          aria-label="Close modal"
        >
          <div
            className={cn(
              'relative h-full w-full transition-colors',
              '[&>svg>path]:hover:fill-[var(--ock-icon-color-foreground-muted)]',
            )}
          >
            {closeSvg}
          </div>
        </button>

        {(appLogo || appName) && (
          <div className="mt-3 flex w-[275px] flex-col items-center gap-3 self-stretch p-2">
            {appLogo && (
              <div className={cn(border.radius, 'h-14 w-14 overflow-hidden')}>
                <img
                  src={appLogo}
                  alt={`${appName || 'App'} icon`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {appName && (
              <h2 className={cn(text.headline, color.foreground)}>{appName}</h2>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleCoinbaseWalletConnection}
            className={cn(
              border.radiusInner,
              line.default,
              text.label2,
              pressable.alternate,
              color.foreground,
              'h-10 w-[275px] px-4 py-2.5',
              'flex items-center justify-between text-left',
            )}
          >
            Sign up
            <div className="h-4 w-4">{defaultAvatarSVG}</div>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={cn(line.default, 'w-full border-[0.5px]')} />
            </div>
            <div className="relative flex justify-center">
              <span
                className={cn(
                  background.default,
                  color.foregroundMuted,
                  text.legal,
                  'px-2',
                )}
              >
                or continue with an existing wallet
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCoinbaseWalletConnection}
            className={cn(
              border.default,
              border.radiusInner,
              line.default,
              text.label2,
              pressable.alternate,
              color.foreground,
              'h-10 w-[275px] px-4 py-2.5',
              'flex items-center justify-between text-left',
            )}
          >
            Coinbase Wallet
            <div className="h-4 w-4">{coinbaseWalletSvg}</div>
          </button>

          <button
            type="button"
            onClick={handleWalletConnectConnector}
            className={cn(
              border.default,
              border.radiusInner,
              line.default,
              text.label2,
              pressable.alternate,
              color.foreground,
              'flex h-[40px] w-[275px] px-4 py-2.5',
              'items-center justify-between text-left',
            )}
          >
            Other wallets
            <div className="h-4 w-4">{walletConnectSvg}</div>
          </button>
        </div>

        <div
          className={cn(
            color.foregroundMuted,
            text.legal,
            'flex flex-col items-center justify-center gap-1 px-4',
            'mt-4 w-[275px] text-center leading-3',
          )}
        >
          <span className="font-normal text-[10px] leading-[13px]">
            By connecting a wallet, you agree to our
          </span>
          <span className="font-normal text-[10px] leading-[13px]">
            {termsOfServiceUrl && (
              <a
                href={termsOfServiceUrl}
                className={cn(color.primary, 'hover:underline')}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={0}
                onKeyDown={(e) => handleLinkKeyDown(e, termsOfServiceUrl)}
              >
                Terms of Service
              </a>
            )}{' '}
            {termsOfServiceUrl && privacyPolicyUrl && 'and'}{' '}
            {privacyPolicyUrl && (
              <a
                href={privacyPolicyUrl}
                className={cn(color.primary, 'hover:underline')}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={0}
                onKeyDown={(e) => handleLinkKeyDown(e, privacyPolicyUrl)}
              >
                Privacy Policy
              </a>
            )}
            .
          </span>
        </div>
      </div>
    </div>
  );
}
