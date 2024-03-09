/**
 * @author 弱不禁风小书生
 */
export class PriorityQueue<T> {
    private data: T[]
    private compare: Function

    public constructor(compare) {
        if (typeof compare !== 'function') {
            throw new Error('compare function required!')
        }
        this.data = []
        this.compare = compare
    }

    private search(elem: T): number {
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

    public push(elem: T): number {
        let index = this.search(elem)
        this.data.splice(index, 0, elem)
        return this.data.length
    }

    public size(): number {
        return this.data.length
    }

    public peek(): T {
        return this.data[0];
    }

    public getData(): T[] {
        return this.data
    }

    public delete(index: number) {
        this.data.splice(index, 1)
    }

    public clear() {
        this.data = []
    }
}