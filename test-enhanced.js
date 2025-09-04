function calculateTotal(price, tax = 0.08) {
  const magicNumber = 100;  // Magic number!
  if (price > magicNumber) {
    return price * (1 + tax);
  }
  return price;
}
