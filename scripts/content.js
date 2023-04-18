// Copyright 2023 Jon Uleis
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const priceSort = document.querySelector(
  ".price_header .sortable_link_selected"
);
const ascending = priceSort?.title.includes("ascending");

function tableSort() {
  // continue only if we are sorting by price
  if (priceSort) {
    const rows = Array.from(document.querySelectorAll("tr[data-release-id]"));
    rows.sort((rowA, rowB) => {
      const priceA = getRowPrice(rowA);
      const priceB = getRowPrice(rowB);
      return ascending ? priceA - priceB : priceB - priceA;
    });
    // append back to table in new order
    rows.forEach((row) => row.parentNode.appendChild(row));
    // change title text
    document.querySelector(".price_header .link-text").innerText =
      "Total Price";
  }
}

function getRowPrice(row) {
  // if there's no total price, get the original bold one
  const price =
    row.querySelector(".converted_price") || row.querySelector(".price");
  // if the item is unavailable and we're sorting by lowest, push to bottom
  const weight =
    row.querySelector(".item_add_to_cart .button") || !ascending ? 0 : 9999999;
  // strip everything else out of the price text
  return parseFloat(price.textContent.replace(/[^0-9]/g, "")) + weight;
}

const pjaxContainer = document.querySelector("#pjax_container");
const observer = new MutationObserver((mutationsList) => {
  for (let mutation of mutationsList) {
    // run function again if we're ajax loading in another table of items
    // console.log(mutation.addedNodes);
    if (
      mutation.type === "childList" &&
      mutation.addedNodes.length &&
      (mutation.addedNodes[1]?.nodeName === "TBODY" ||
        mutation.addedNodes[3]?.nodeName === "TABLE")
    ) {
      tableSort();
    }
  }
});
observer.observe(pjaxContainer, { subtree: true, childList: true });

// first run
tableSort();
