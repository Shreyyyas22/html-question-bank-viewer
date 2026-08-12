import { JSDOM } from 'jsdom';

const html = `<iframe srcdoc="&lt;html&gt;&lt;body&gt;Hello&lt;/body&gt;&lt;/html&gt;"></iframe>`;

const dom = new JSDOM(html);
const iframe = dom.window.document.querySelector('iframe');
console.log(iframe.getAttribute('srcdoc'));
