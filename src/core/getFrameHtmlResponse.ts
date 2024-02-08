import { FrameMetadataType } from './types';

/**
 * Returns an HTML string containing metadata for a new valid frame.
 *
 * @param buttons: The buttons to use for the frame.
 * @param image: The image to use for the frame.
 * @param input: The text input to use for the frame.
 * @param postUrl: The URL to post the frame to.
 * @param refreshPeriod: The refresh period for the image used.
 * @returns An HTML string containing metadata for the frame.
 */
function getFrameHtmlResponse({
  buttons,
  image,
  input,
  postUrl,
  post_url,
  refreshPeriod,
  refresh_period,
}: FrameMetadataType): string {
  // Set the image metadata if it exists.
  const imageHtml = image ? `<meta property="fc:frame:image" content="${image}" />` : '';

  // Set the input metadata if it exists.
  const inputHtml = input ? `<meta property="fc:frame:input:text" content="${input.text}" />` : '';

  // Set the button metadata if it exists.
  let buttonsHtml = '';
  if (buttons) {
    buttonsHtml = buttons
      .map((button, index) => {
        let buttonHtml = `<meta property="fc:frame:button:${index + 1}" content="${button.label}" />`;
        if (button.action) {
          buttonHtml += `<meta property="fc:frame:button:${index + 1}:action" content="${button.action}" />`;
        }
        if ((button.action == 'link' || button.action == 'mint') && button.target) {
          buttonHtml += `<meta property="fc:frame:button:${index + 1}:target" content="${button.target}" />`;
        }
        return buttonHtml;
      })
      .join('');
  }

  // Set the post_url metadata if it exists.
  const postUrlToUse = postUrl || post_url;
  const postUrlHtml = postUrlToUse ? `<meta property="fc:frame:post_url" content="${postUrlToUse}" />` : '';

  // Set the refresh_period metadata if it exists.
  const refreshPeriodToUse = refreshPeriod || refresh_period;
  const refreshPeriodHtml = refreshPeriodToUse
    ? `<meta property="fc:frame:refresh_period" content="${refreshPeriodToUse.toString()}" />`
    : '';

  // Return the HTML string containing all the metadata.
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  ${buttonsHtml}
  ${imageHtml}
  ${inputHtml}
  ${postUrlHtml}
  ${refreshPeriodHtml}
</head>
</html>`;

  return html;
}

export { getFrameHtmlResponse };
