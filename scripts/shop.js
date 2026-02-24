// Copyright 2026 Jon Uleis
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const UNAVAILABLE_PRICE = 999999;
let sortedByPrice = false;
const originalFetch = window.fetch;

window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);

  const url = new URL(args[0] instanceof Request ? args[0].url : args[0], location.origin);
  if (!url.pathname.includes("/api/shop-page-api/sell_item")) return response;

  if (url.searchParams.get("sort") !== "price") {
    sortedByPrice = false;
    return response;
  }

  sortedByPrice = true;
  const ascending = url.searchParams.get("sortOrder") === "ascending";

  const clone = response.clone();
  const data = await clone.json();

  if (!data.items || !Array.isArray(data.items)) return response;

  data.items.sort((a, b) => {
    const totalA = getItemTotal(a, ascending);
    const totalB = getItemTotal(b, ascending);
    return ascending ? totalA - totalB : totalB - totalA;
  });

  return new Response(JSON.stringify(data), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

function getItemTotal(item, ascending) {
  const itemPrice = item.price?.buyerItemPrice;
  const shippingPrice = item.shipping?.buyerShippingPrice;

  if (itemPrice == null) return ascending ? UNAVAILABLE_PRICE : 0;
  if (shippingPrice == null) return ascending ? UNAVAILABLE_PRICE : itemPrice;

  return itemPrice + shippingPrice;
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("#root");
  if (!root) return;

  const observer = new MutationObserver(() => {
    if (!sortedByPrice) return;

    const priceHeaderButton = document.querySelector(".justify-self-end button");
    if (!priceHeaderButton) return;

    for (const node of priceHeaderButton.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "Price") {
        node.textContent = "Total Price";
        break;
      }
    }
  });

  observer.observe(root, { subtree: true, childList: true });
});
