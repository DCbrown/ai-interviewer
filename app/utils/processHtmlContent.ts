import { JSDOM } from 'jsdom';

export async function processHtmlContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Create a virtual DOM using jsdom
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove script and style elements
    const scripts = document.getElementsByTagName('script');
    const styles = document.getElementsByTagName('style');
    
    while (scripts.length > 0) {
      scripts[0].parentNode?.removeChild(scripts[0]);
    }
    while (styles.length > 0) {
      styles[0].parentNode?.removeChild(styles[0]);
    }

    // Get all text content
    const textContent = document.body.textContent || '';
    
    // Clean up the text content
    const cleanedText = textContent
      .replace(/\s+/g, ' ')
      .trim();

    return cleanedText;
  } catch (error) {
    console.error('Error processing HTML content:', error);
    return null;
  }
}
