export interface SampleSnippet {
  id: string;
  label: string;
  description: string;
  /** Rough expectation, shown as a hint in the UI. */
  expectation: string;
  html: string;
}

/** Ready-made snippets so the tool can be tried without any setup. */
export const SAMPLES: SampleSnippet[] = [
  {
    id: "broken-checkout",
    label: "Checkout form (many issues)",
    description:
      "A sign-up form missing labels, using a clickable div as a button and skipping heading levels.",
    expectation: "Several critical issues",
    html: `<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  </head>
  <body>
    <h3>Create your account</h3>
    <img src="/hero.png">
    <form>
      <input type="text" name="first_name" placeholder="First name">
      <label>Last name</label>
      <input type="email" name="email">
      <select name="country">
        <option>Australia</option>
      </select>
      <input type="checkbox" name="terms"> I agree to the terms
      <div onclick="submitForm()">Sign up</div>
      <button><svg viewBox="0 0 24 24"><path d="M6 6l12 12"/></svg></button>
    </form>
    <a href="#">Read more</a>
  </body>
</html>`,
  },
  {
    id: "navigation",
    label: "Site navigation",
    description:
      "Navigation with icon-only links, redundant ARIA, a positive tabindex and a hidden, focusable menu.",
    expectation: "ARIA and keyboard focus issues",
    html: `<html lang="en">
  <body>
    <nav role="navigation" class="site-nav">
      <ul role="list">
        <li><a href="/">Home</a></li>
        <li><a href="/pricing" tabindex="2">Pricing</a></li>
        <li><a href="/docs"><svg aria-hidden="true"><path d="M2 2h20"/></svg></a></li>
        <li><a href="/contact" aria-label="Contact us"><img src="/phone.png" alt=""></a></li>
      </ul>
    </nav>
    <nav aria-hidden="true">
      <a href="/secret">Admin tools</a>
    </nav>
    <div id="mobile-menu" role="button" aria-label="" onclick="toggleMenu()">☰</div>
    <a href="https://example.com" target="_blank">Full report</a>
  </body>
</html>`,
  },
  {
    id: "gallery",
    label: "Image gallery",
    description:
      "Thumbnails with missing or redundant alt text, inline SVG icons and a figcaption gap.",
    expectation: "Text alternative problems",
    html: `<section>
  <h2>Team gallery</h2>
  <img src="/ada.png">
  <img src="/grace.png" alt="image of Grace">
  <img src="/hero-banner.jpg" alt="hero-banner.jpg">
  <a href="/profile/ada"><img src="/ada-thumb.png" alt=""></a>
  <button aria-label="Next slide">
    <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
  </button>
  <i class="fa fa-search"></i>
</section>`,
  },
  {
    id: "data-table",
    label: "Data table",
    description:
      "A pricing table with no caption and header cells that are missing scope.",
    expectation: "Table structure issues",
    html: `<section>
  <h2>Pricing</h2>
  <table>
    <tr>
      <th>Plan</th>
      <th>Price</th>
      <th>Seats</th>
    </tr>
    <tr>
      <td>Starter</td>
      <td>$9</td>
      <td>1</td>
    </tr>
    <tr>
      <td>Team</td>
      <td>$29</td>
      <td>10</td>
    </tr>
  </table>
</section>`,
  },
  {
    id: "dialog",
    label: "Modal dialog",
    description:
      "A custom dialog built from divs with a focusable element hidden from assistive tech and low-contrast text.",
    expectation: "ARIA and contrast issues",
    html: `<div class="backdrop">
  <div role="dialog" class="modal">
    <h2>Delete this project?</h2>
    <p style="color:#9aa0a6;background-color:#ffffff">
      This action cannot be undone.
    </p>
    <div aria-hidden="true">
      <button type="button">Delete</button>
    </div>
    <span role="button" onclick="closeDialog()">Cancel</span>
  </div>
</div>`,
  },
  {
    id: "good-page",
    label: "Well-built page (control)",
    description:
      "A small page that follows the rules, useful for comparing scores.",
    expectation: "Few or no issues",
    html: `<html lang="en">
  <head>
    <title>Contact – A11y Demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <header>
      <nav aria-label="Primary">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <h1>Contact us</h1>
      <p>We usually reply within one business day.</p>
      <form>
        <fieldset>
          <legend>How should we reach you?</legend>
          <label for="name">Full name</label>
          <input id="name" name="name" type="text" autocomplete="name">
          <label for="email">Email address</label>
          <input id="email" name="email" type="email" autocomplete="email">
          <button type="submit">Send message</button>
        </fieldset>
      </form>
    </main>
    <footer>
      <p>© 2026 A11y Demo</p>
    </footer>
  </body>
</html>`,
  },
];
