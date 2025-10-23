// File: calculator.test.js

const Calculator = require('./calculator');

describe('Calculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add()', () => {
    test('should return the sum of two positive numbers', () => {
      expect(calculator.add(3, 5)).toBe(8);
    });

    test('should return the sum of two negative numbers', () => {
      expect(calculator.add(-3, -5)).toBe(-8);
    });

    test('should return the sum of a positive and a negative number', () => {
      expect(calculator.add(3, -5)).toBe(-2);
    });

    test('should return the sum when one number is zero', () => {
      expect(calculator.add(0, 5)).toBe(5);
    });
  });

  describe('subtract()', () => {
    test('should return the difference of two positive numbers', () => {
      expect(calculator.subtract(10, 5)).toBe(5);
    });

    test('should return the difference of two negative numbers', () => {
      expect(calculator.subtract(-10, -5)).toBe(-5);
    });

    test('should return the difference of a positive and a negative number', () => {
      expect(calculator.subtract(10, -5)).toBe(15);
    });

    test('should return the difference when subtracting zero', () => {
      expect(calculator.subtract(5, 0)).toBe(5);
    });
  });

  describe('multiply()', () => {
    test('should return the product of two positive numbers', () => {
      expect(calculator.multiply(3, 5)).toBe(15);
    });

    test('should return the product of a positive and a negative number', () => {
      expect(calculator.multiply(3, -5)).toBe(-15);
    });

    test('should return zero when multiplying by zero', () => {
      expect(calculator.multiply(3, 0)).toBe(0);
    });

    test('should return the product of two negative numbers', () => {
      expect(calculator.multiply(-3, -5)).toBe(15);
    });
  });

  describe('divide()', () => {
    test('should return the quotient of two positive numbers', () => {
      expect(calculator.divide(10, 2)).toBe(5);
    });

    test('should return the quotient of a positive and a negative number', () => {
      expect(calculator.divide(10, -2)).toBe(-5);
    });

    test('should return the quotient of two negative numbers', () => {
      expect(calculator.divide(-10, -2)).toBe(5);
    });

    test('should throw an error when dividing by zero', () => {
      expect(() => calculator.divide(10, 0)).toThrow('Division by zero');
    });
  });

  describe('power()', () => {
    test('should return the base raised to the exponent', () => {
      expect(calculator.power(2, 3)).toBe(8);
    });

    test('should return 1 when the exponent is zero', () => {
      expect(calculator.power(5, 0)).toBe(1);
    });

    test('should return the base when the exponent is 1', () => {
      expect(calculator.power(5, 1)).toBe(5);
    });

    test('should return 0 when the base is zero and exponent is positive', () => {
      expect(calculator.power(0, 3)).toBe(0);
    });
  });

  describe('sqrt()', () => {
    test('should return the square root of a positive number', () => {
      expect(calculator.sqrt(16)).toBe(4);
    });

    test('should return 0 for square root of zero', () => {
      expect(calculator.sqrt(0)).toBe(0);
    });

    test('should throw an error for square root of a negative number', () => {
      expect(() => calculator.sqrt(-16)).toThrow('Cannot calculate square root of negative number');
    });
  });

  describe('isEven()', () => {
    test('should return true for an even number', () => {
      expect(calculator.isEven(4)).toBe(true);
    });

    test('should return false for an odd number', () => {
      expect(calculator.isEven(5)).toBe(false);
    });

    test('should return true for zero', () => {
      expect(calculator.isEven(0)).toBe(true);
    });
  });

  describe('abs()', () => {
    test('should return the absolute value of a positive number', () => {
      expect(calculator.abs(5)).toBe(5);
    });

    test('should return the absolute value of a negative number', () => {
      expect(calculator.abs(-5)).toBe(5);
    });

    test('should return zero for zero', () => {
      expect(calculator.abs(0)).toBe(0);
    });
  });
});