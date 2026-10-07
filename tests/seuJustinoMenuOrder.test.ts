import assert from "node:assert/strict";
import test from "node:test";
import {
  applySeuJustinoSubcategoryOrder,
  sortBySavedSubcategoryOrder,
} from "../app/cardapio/seuJustinoMenuOrder";

test("a ordem salva no admin fica na frente da ordem fixa do Seu Justino", () => {
  const groups = [
    {
      name: "Vodka",
      items: [
        { order: 0, subcategoryOrder: 1 },
        { order: 1, subcategoryOrder: 1 },
      ],
    },
    {
      name: "Gin",
      items: [
        { order: 10, subcategoryOrder: 0 },
        { order: 11, subcategoryOrder: 0 },
      ],
    },
  ];

  const saved = sortBySavedSubcategoryOrder(groups);
  assert.deepEqual(
    saved?.map((group) => group.name),
    ["Gin", "Vodka"],
  );

  const hardcoded = applySeuJustinoSubcategoryOrder("justino", "Bebidas", groups);
  assert.equal(hardcoded[0].name, "Vodka");
});

test("sem ordem de seção salva, o Seu Justino continua na ordem fixa", () => {
  const groups = [
    {
      name: "Gin",
      items: [
        { order: 0, subcategoryOrder: 0 },
        { order: 1, subcategoryOrder: 1 },
      ],
    },
    {
      name: "Vodka",
      items: [
        { order: 10, subcategoryOrder: 10 },
        { order: 11, subcategoryOrder: 11 },
      ],
    },
  ];

  assert.equal(sortBySavedSubcategoryOrder(groups), null);
  const hardcoded = applySeuJustinoSubcategoryOrder("justino", "Bebidas", groups);
  assert.equal(hardcoded[0].name, "Vodka");
  assert.equal(hardcoded[1].name, "Gin");
});
