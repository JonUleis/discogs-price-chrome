// Copyright 2026 Jon Uleis
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const UNAVAILABLE_PRICE = 999999;

function tableSort() {
  const priceSort = document.querySelector(".price_header .sortable_link_selected");
  if (!priceSort) return;

  const ascending = priceSort.title.includes("ascending");
  const rows = Array.from(document.querySelectorAll("tr[data-release-id]"));

  rows.sort((rowA, rowB) => {
    const priceA = getRowPrice(rowA, ascending);
    const priceB = getRowPrice(rowB, ascending);
    return ascending ? priceA - priceB : priceB - priceA;
  });

  rows.forEach((row) => row.parentNode.appendChild(row));

  const headerText = document.querySelector(".price_header .link-text");
  if (headerText) {
    headerText.innerText = "Total Price";
  }
}

function getRowPrice(row, ascending) {
  const price = row.querySelector(".converted_price") || row.querySelector(".price");
  const hasAddToCart = row.querySelector(".item_add_to_cart .button");
  const weight = hasAddToCart || !ascending ? 0 : UNAVAILABLE_PRICE;
  return parseFloat(price.textContent.replace(/[^0-9]/g, "")) + weight;
}

const pjaxContainer = document.querySelector("#pjax_container");
if (pjaxContainer) {
  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        const hasTableNodes = Array.from(mutation.addedNodes).some(
          (node) => node.nodeName === "TBODY" || node.nodeName === "TABLE"
        );
        if (hasTableNodes) {
          tableSort();
        }
      }
    }
  });
  observer.observe(pjaxContainer, { subtree: true, childList: true });
}

tableSort();
