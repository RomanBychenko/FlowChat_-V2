// Лаба 4 — Bi-directional Priority Queue
export class PriorityQueue {

    constructor() {
        // кожен елемент: { value, priority }
        this.items = [];
    }

    // додати елемент з пріоритетом (за замовчуванням 0)
    enqueue(value, priority = 0) {
        this.items.push({ value, priority });
    }

    // подивитись елемент без видалення
    peek(mode = 'oldest') {

        if (this.items.length === 0) {
            return undefined;
        }

        switch (mode) {
            case 'oldest':
                return this.items[0].value;
            case 'newest':
                return this.items[this.items.length - 1].value;
            case 'highest':
                return this.items[this._findExtremeIndex(true)].value;
            case 'lowest':
                return this.items[this._findExtremeIndex(false)].value;
            default:
                throw new Error('Unknown mode: ' + mode);
        }
    }

    // дістати і видалити елемент
    dequeue(mode = 'oldest') {

        if (this.items.length === 0) {
            return undefined;
        }

        switch (mode) {
            case 'oldest':
                return this.items.shift().value;   // перший елемент масиву
            case 'newest':
                return this.items.pop().value;     // останній елемент масиву
            case 'highest':
                return this.items.splice(this._findExtremeIndex(true), 1)[0].value;
            case 'lowest':
                return this.items.splice(this._findExtremeIndex(false), 1)[0].value;
            default:
                throw new Error('Unknown mode: ' + mode);
        }
    }

    // знаходить індекс елемента з найбільшим/найменшим пріоритетом
    _findExtremeIndex(highest) {
        let bestIndex = 0;

        for (let i = 1; i < this.items.length; i++) {
            if (highest && this.items[i].priority > this.items[bestIndex].priority) {
                bestIndex = i;
            }
            if (!highest && this.items[i].priority < this.items[bestIndex].priority) {
                bestIndex = i;
            }
        }

        return bestIndex;
    }

    isEmpty() {
        return this.items.length === 0;
    }
}