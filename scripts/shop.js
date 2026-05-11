// Copyright 2026 Jon Uleis
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

let sortedByPrice = false;
let priceClickFromOtherColumn = false;
const originalFetch = window.fetch;
const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;

window.fetch = async function (...args) {
  const url = new URL(args[0] instanceof Request ? args[0].url : args[0], location.origin);
  const isShopApi = url.pathname.includes("/api/shop-page-api/sell_item");

  if (isShopApi && priceClickFromOtherColumn) {
    priceClickFromOtherColumn = false;
    if (url.searchParams.get("sort") === "price" && url.searchParams.get("sortOrder") === "descending") {
      queueMicrotask(() => {
        const sortSelect = findSortSelect();
        if (!sortSelect) return;
        nativeSelectValueSetter.call(sortSelect, "priceLowest");
        sortSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }
  }

  const response = await originalFetch.apply(this, args);

  if (!isShopApi) return response;

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
    if (ascending) {
      const availA = isItemAvailable(a);
      const availB = isItemAvailable(b);
      if (availA !== availB) return availA ? -1 : 1;
    }
    const totalA = getItemTotal(a);
    const totalB = getItemTotal(b);
    return ascending ? totalA - totalB : totalB - totalA;
  });

  return new Response(JSON.stringify(data), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

function isItemAvailable(item) {
  return item.price?.buyerItemPrice != null;
}

function getItemTotal(item) {
  const itemPrice = item.price?.buyerItemPrice ?? 0;
  const shippingPrice = item.shipping?.buyerShippingPrice ?? 0;
  return itemPrice + shippingPrice;
}

function findSortSelect() {
  return document.querySelector('select.brand-select option[value="priceLowest"]')?.parentElement ?? null;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".justify-self-end button");
  if (!button) return;

  const text = button.textContent.trim();
  if (text !== "Price" && text !== "Total Price") return;

  const sortSelect = findSortSelect();
  if (!sortSelect) return;
  if (sortSelect.value === "priceLowest" || sortSelect.value === "priceHighest") return;

  priceClickFromOtherColumn = true;
}, true);

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("#root");
  if (!root) return;

  const observer = new MutationObserver(() => {
    if (!sortedByPrice) return;

    const priceHeaderButton = document.querySelector(".justify-self-end button");
    if (!priceHeaderButton) return;
    if (priceHeaderButton.textContent.includes("Total Price")) return;

    for (const node of priceHeaderButton.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "Price") {
        node.textContent = "Total Price";
        break;
      }
    }
  });

  observer.observe(root, { subtree: true, childList: true });
});
