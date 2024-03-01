/**
 * @author panda
 */
export class PriorityQueue<T> {

    private data: T[]
    private compare: Function

    constructor(compare) {
        if (typeof compare !== 'function') {
            throw new Error('compare function required!')
        }
        this.data = []
        this.compare = compare
    }

    search(elem: T): number {
        let low = 0, high = this.data.length
        while (low < high) {
            let mid = low + ((high - low) >> 1)
            if (this.compare(this.data[mid], elem) > 0) {
                high = mid
            }
            else {
                low = mid + 1
            }
        }
        return low;
    }

    push(elem: T): number {
        let index = this.search(elem)
        this.data.splice(index, 0, elem)
        return this.data.length
    }

    size(): number {
        return this.data.length
    }

    peek(): T {
        return this.data[0];
    }

    getData(): T[] {
        return this.data
    }

    delete(index: number) {
        this.data.splice(index, 1)
    }

    clear() {
        this.data = []
    }
}