import { getFrameHtmlResponse } from './getFrameHtmlResponse';

describe('getFrameHtmlResponse', () => {
  it('should return correct HTML with all parameters', () => {
    const html = getFrameHtmlResponse({
      buttons: [
        { label: 'button1', action: 'post' },
        { label: 'button2', action: 'mint', target: 'https://example.com' },
        { label: 'button3', action: 'post_redirect' },
        { label: 'button4' },
      ],
      image: 'https://example.com/image.png',
      input: {
        text: 'Enter a message...',
      },
      post_url: 'https://example.com/api/frame',
      refresh_period: 10,
    });

    expect(html).toBe(
      '<!DOCTYPE html><html><head><meta property="fc:frame" content="vNext" />' +
        '<meta property="fc:frame:image" content="https://example.com/image.png" />' +
        '<meta property="fc:frame:input:text" content="Enter a message..." />' +
        '<meta property="fc:frame:button:1" content="button1" />' +
        '<meta property="fc:frame:button:1:action" content="post" />' +
        '<meta property="fc:frame:button:2" content="button2" />' +
        '<meta property="fc:frame:button:2:action" content="mint" />' +
        '<meta property="fc:frame:button:2:target" content="https://example.com" />' +
        '<meta property="fc:frame:button:3" content="button3" />' +
        '<meta property="fc:frame:button:3:action" content="post_redirect" />' +
        '<meta property="fc:frame:button:4" content="button4" />' +
        '<meta property="fc:frame:post_url" content="https://example.com/api/frame" />' +
        '<meta property="fc:frame:refresh_period" content="10" /></head></html>',
    );
  });

  it('should return correct HTML with action mint', () => {
    const html = getFrameHtmlResponse({
      buttons: [{ label: 'Mint', action: 'mint', target: 'https://zizzamia.xyz/api/frame/mint' }],
      image: 'https://zizzamia.xyz/park-1.png',
    });

    expect(html).toBe(
      '<!DOCTYPE html><html><head><meta property="fc:frame" content="vNext" />' +
        '<meta property="fc:frame:image" content="https://zizzamia.xyz/park-1.png" />' +
        '<meta property="fc:frame:button:1" content="Mint" />' +
        '<meta property="fc:frame:button:1:action" content="mint" />' +
        '<meta property="fc:frame:button:1:target" content="https://zizzamia.xyz/api/frame/mint" /></head></html>',
    );
  });

  it('should return correct HTML with action linkt', () => {
    const html = getFrameHtmlResponse({
      buttons: [{ label: 'Link', action: 'link', target: 'https://zizzamia.xyz/api/frame/link' }],
      image: 'https://zizzamia.xyz/park-1.png',
    });

    expect(html).toBe(
      '<!DOCTYPE html><html><head><meta property="fc:frame" content="vNext" />' +
        '<meta property="fc:frame:image" content="https://zizzamia.xyz/park-1.png" />' +
        '<meta property="fc:frame:button:1" content="Link" />' +
        '<meta property="fc:frame:button:1:action" content="link" />' +
        '<meta property="fc:frame:button:1:target" content="https://zizzamia.xyz/api/frame/link" /></head></html>',
    );
  });

  it('should handle no input', () => {
    const html = getFrameHtmlResponse({
      buttons: [{ label: 'button1' }],
      image: 'https://example.com/image.png',
      post_url: 'https://example.com/api/frame',
    });

    expect(html).toContain('<meta property="fc:frame" content="vNext" />');
    expect(html).toContain('<meta property="fc:frame:button:1" content="button1" />');
    expect(html).toContain(
      '<meta property="fc:frame:image" content="https://example.com/image.png" />',
    );
    expect(html).toContain(
      '<meta property="fc:frame:post_url" content="https://example.com/api/frame" />',
    );
    expect(html).not.toContain('fc:frame:input:text');
  });

  it('should handle no buttons', () => {
    const html = getFrameHtmlResponse({
      image: 'https://example.com/image.png',
      post_url: 'https://example.com/api/frame',
    });

    expect(html).toContain('<meta property="fc:frame" content="vNext" />');
    expect(html).toContain(
      '<meta property="fc:frame:image" content="https://example.com/image.png" />',
    );
    expect(html).toContain(
      '<meta property="fc:frame:post_url" content="https://example.com/api/frame" />',
    );
    expect(html).not.toContain('fc:frame:button:');
  });

  it('should handle no post_url', () => {
    const html = getFrameHtmlResponse({
      buttons: [{ label: 'button1' }],
      image: 'https://example.com/image.png',
    });

    expect(html).toContain('<meta property="fc:frame" content="vNext" />');
    expect(html).toContain(
      '<meta property="fc:frame:image" content="https://example.com/image.png" />',
    );
    expect(html).toContain('<meta property="fc:frame:button:1" content="button1" />');
    expect(html).not.toContain('fc:frame:post_url');
  });

  it('should handle no refresh_period', () => {
    const html = getFrameHtmlResponse({
      buttons: [{ label: 'button1' }],
      image: 'https://example.com/image.png',
      post_url: 'https://example.com/api/frame',
    });

    expect(html).toContain('<meta property="fc:frame" content="vNext" />');
    expect(html).toContain(
      '<meta property="fc:frame:image" content="https://example.com/image.png" />',
    );
    expect(html).toContain('<meta property="fc:frame:button:1" content="button1" />');
    expect(html).toContain(
      '<meta property="fc:frame:post_url" content="https://example.com/api/frame" />',
    );
    expect(html).not.toContain('fc:frame:refresh_period');
  });
});

export { getFrameHtmlResponse };
