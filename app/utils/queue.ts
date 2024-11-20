class QueueNode<T> {
	value: T;
	next: QueueNode<T> | null = null;
	constructor(value: T) {
		this.value = value;
	}
}

export class Queue<T> {
	private head: QueueNode<T> | null = null;
	private tail: QueueNode<T> | null = null;
	private size = 0;

	public enqueue(value: T): void {
		const newNode = new QueueNode(value);
		if (!this.head) {
			this.head = this.tail = newNode;
		} else {
			this.tail!.next = newNode;
			this.tail = newNode;
		}
		this.size++;
	}

	public getListForm(): T[] {
		const list: T[] = [];
		let current = this.head;
		while (current) {
			list.push(current.value);
			current = current.next;
		}
		return list;
	}

	public print(): void {
		let current = this.head;
		while (current) {
			console.log(current.value);
			current = current.next;
		}
	}

	public dequeue(): T | undefined {
		if (!this.head) return undefined;
		const value = this.head.value;
		this.head = this.head.next;
		this.size--;
		if (!this.head) this.tail = null;
		return value;
	}

	public peek(): T | undefined {
		return this.head?.value;
	}

	public isEmpty(): boolean {
		return this.size === 0;
	}

	public getSize(): number {
		return this.size;
	}
}
