/**
 * Knowledge base for the in-app AI chatbot helper.
 * Intent matching is keyword-based; order matters (first match wins for multi-keyword entries).
 */

const normalize = (s) => (s || '').toLowerCase().trim()

const intents = [
  // --- Colouring book step-by-step (specific phrases first)
  {
    keywords: ['colouring book', 'coloring book', 'create a book', 'make a book', 'step by step', 'how to make a colouring book', 'how to create a colouring book'],
    answer: `Here’s a simple step-by-step guide to create your own colouring book in Color Charm:

**1. Create the title page (Word Art)**  
Go to Create → Word Art. Type your book title (e.g. "My Colouring Book Vol 1") and pick a style. Generate and save the image.

**2. Create the inside pages (Text prompt)**  
Go to Create → Text prompt. For each page, use a **different prompt** (e.g. "cat in a garden", "dragon in a castle") so your book has variety. We recommend using the **Improve** button to refine your prompt before generating for better results.

**3. Organise in a folder**  
Create a folder (e.g. "My Colouring Book") and add your title image and all page images to it. You can reorder them in the folder view.

**4. Download as PDF**  
Open the folder, use the download option and choose **Download as PDF** to get one file with all pages in order.

**Tip:** If the server is busy, generate only 1–2 images at a time for more reliable results.`,
  },
  // --- Server busy / slow
  {
    keywords: ['server busy', 'server slow', 'slow', 'busy', 'taking long', 'timeout', 'generate 1', 'generate 2', 'one at a time', 'two at a time'],
    answer: `When the server is busy, generation can be slower or time out. We recommend:

• **Generate 1 or 2 images at a time** instead of many at once.  
• Use **Fast** quality when you want quicker results (1 credit per image).  
• If a request fails, wait a moment and try again with fewer images.

You can always check your credits in the header and manage your plan in Profile.`,
  },
  // --- How to create: text prompt
  {
    keywords: ['text prompt', 'text to image', 'how to create with text', 'prompt', 'describe', 'type a description'],
    answer: `**Creating with a text prompt**

1. Go to **Create** in the sidebar and choose **Text prompt** (or Create → Text).
2. Type a description of what you want, e.g. "dragon in a forest", "cute puppy with a bow".
3. Optionally use the **Improve** button to refine your prompt for better results.
4. Choose quality (Standard = 2 credits, Fast = 1 credit) and how many images (1–6 on paid plans).
5. Click **Generate** and wait for your colouring page. You can then save to a folder, download, or add to favourites.`,
  },
  // --- How to create: word art
  {
    keywords: ['word art', 'wordart', 'title', 'text as image'],
    answer: `**Creating with Word Art**

1. Go to **Create** → **Word Art**.
2. Enter the text you want (e.g. a book title like "Adventure Time" or a single word).
3. Pick a style (e.g. bubble, script) and adjust if needed.
4. Use **Improve** to get a stronger prompt, then **Generate**.
5. Great for book covers, titles, and decorative text pages.`,
  },
  // --- How to create: photo
  {
    keywords: ['photo', 'upload photo', 'picture to colour', 'photo to line art', 'turn photo into'],
    answer: `**Creating from a photo**

1. Go to **Create** → **Photo** (available on Hobby, Artist and Business plans).
2. Upload a photo. The AI will convert it into line art suitable for colouring.
3. You can set a style hint (e.g. "simple lines") and choose quality and count.
4. Generate and then download or add to a folder.

Photo conversion is a premium feature; upgrade in **Profile** or **Choose plan** if you don’t see it.`,
  },
  // --- Improve button
  {
    keywords: ['improve', 'improve button', 'improve prompt'],
    answer: `The **Improve** button (on the create screen) suggests a better version of your text prompt so the AI can generate clearer, more detailed colouring pages. We recommend using it before generating, especially for text and word art. It doesn’t use credits—only the actual generation does.`,
  },
  // --- Billing & subscription
  {
    keywords: ['bill', 'billing', 'subscription', 'subscribe', 'plan', 'upgrade', 'downgrade', 'cancel subscription', 'payment', 'pay', 'price', 'cost', 'refund'],
    answer: `**Billing & subscriptions**

• **Plans:** Free trial includes limited credits. Paid plans (Starter, Hobby, Artist, Business) give more credits and features (e.g. photo, front cover, PDF export).  
• **Upgrade:** Go to **Profile** or **Choose plan** to see plans and upgrade.  
• **Add credits:** You can add one-time credit packs from **Profile** → **Add credits**.  
• **Credits:** Standard quality = 2 credits per image; Fast quality = 1 credit per image.  
• **Managing subscription:** Use the links in your plan/checkout emails or go to **Profile** to manage or cancel. Refunds follow our Terms of Service.`,
  },
  // --- Credits
  {
    keywords: ['credit', 'credits', 'how many credits', 'credits per image', 'run out of credits', 'insufficient credits'],
    answer: `**Credits**

• **Standard quality:** 2 credits per image.  
• **Fast quality:** 1 credit per image.  
• Your **credits remaining** and plan are shown in the header. Click the credits chip for details (plan credits, used, next refill).  
• To get more: upgrade your plan (Profile or Choose plan) or buy a one-time credit pack (Add credits).`,
  },
  // --- Folders & PDF
  {
    keywords: ['folder', 'folders', 'organise', 'organize', 'pdf', 'download pdf', 'export pdf'],
    answer: `**Folders & PDF**

• **Folders:** Use **Folders** in the sidebar to create folders and organise your colouring pages. Open a folder to add, remove, or reorder pages.  
• **Download as PDF:** Open a folder; use the download menu and choose "Download as PDF" (available on Hobby, Artist and Business plans) to get one PDF with all pages in order.  
• You can also download single images or multiple as ZIP from the gallery or folder view.`,
  },
  // --- General what is / FAQ
  {
    keywords: ['what is color charm', 'what is colour charm', 'what is this app', 'faq', 'help', 'how does it work'],
    answer: `**Color Charm** is an AI-powered colouring page generator. You can:

• **Text prompt** – Describe an image (e.g. "dragon in a forest") and get a printable colouring page.  
• **Word Art** – Turn words or titles into decorative colouring art.  
• **Photo** – Turn photos into line art (on higher plans).  

Create pages, organise them in folders, and download as images or PDF. Start from the **Dashboard** or **Create** in the sidebar. For more FAQs, visit the **FAQ** page (link in footer or support).`,
  },
  // --- Create / generate
  {
    keywords: ['how to create', 'how do i create', 'create page', 'generate', 'make a colouring page', 'make a coloring page'],
    answer: `To create a colouring page:

1. Click **Create** in the sidebar (or go to Dashboard and choose a creation type).  
2. Pick **Text prompt** (describe an image), **Word Art** (text as art), or **Photo** (upload a photo; premium).  
3. Enter your prompt or upload, use **Improve** if you like, then click **Generate**.  
4. Save to a folder, download, or add to favourites.

Ask me specifically about "text prompt", "word art", or "photo" for step-by-step guides.`,
  },
  // --- Gallery / saved
  {
    keywords: ['gallery', 'saved', 'my pages', 'where are my', 'find my'],
    answer: `**Gallery** (in the sidebar) shows all your created colouring pages. You can search, filter, add to favourites, move to folders, and download. **Folders** let you group pages (e.g. per book). **Favorites** lists only your favourited pages.`,
  },
  // --- Front cover
  {
    keywords: ['front cover', 'cover', 'book cover'],
    answer: `**Front cover** is a creation type (Create → Front cover) available on Hobby, Artist and Business plans. You enter a title and a prompt; the AI generates a book-cover style colouring image. Great for the first page of a colouring book.`,
  },
  // --- Contact / Get Help / support
  {
    keywords: ['contact', 'contact us', 'get help', 'support', 'speak to someone', 'reach out', 'talk to someone', 'human', 'real person', 'help form', 'settings help', 'need more help'],
    answer: `If you need extra help, you can reach out to us using the **Contact us** form in the **Get Help** section of the Settings page.

Go to **Profile** (or **Settings**) in the sidebar, then open the **Get Help** section and submit the contact form. Someone will get back to you.`,
  },
]

const defaultAnswer = `I can help with questions about Color Charm, such as:

• **Creating pages** – text prompt, word art, or photo  
• **Making a colouring book** – step-by-step (word art title, text prompts, folder, PDF)  
• **Credits & billing** – plans, subscriptions, credits per image  
• **Folders & PDF** – organising and downloading  
• **Server busy** – generating 1–2 images at a time  

If you need extra help, use the **Contact us** form in the **Get Help** section of the Settings (Profile) page to reach out to someone.

Type a short question or pick a suggestion below.`

/**
 * Find an answer for the user message. Uses keyword matching on normalized text.
 * @param {string} userMessage
 * @returns {string}
 */
export function getChatbotResponse(userMessage) {
  const text = normalize(userMessage)
  if (!text) return defaultAnswer

  for (const intent of intents) {
    const matched = intent.keywords.some((kw) => text.includes(normalize(kw)))
    if (matched) return intent.answer
  }

  return defaultAnswer
}

/**
 * Suggested quick questions for the chat UI.
 */
export const suggestedQuestions = [
  'How do I create a colouring book?',
  'How do I use text prompt?',
  'How do I use word art?',
  'How do I turn a photo into a colouring page?',
  'How do credits and billing work?',
  'Server is slow—what should I do?',
  'How do I use the Improve button?',
  'How do I download as PDF?',
  'What is Color Charm?',
  'How do I contact support?',
]
