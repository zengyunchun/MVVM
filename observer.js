class Observer {
    constructor(data) {
        this.observe(data);
    }

    observe(data) {
        // 要对这个data数据将原有的属性改成set和get的形式
        if (!data || typeof data !== "object") {
            return;
        }
        // 要将数据一一劫持 先获取到data的key和value
        // 把对象转换成数组再循环
        Object.keys(data).forEach(key => {
            // 劫持, 定义响应式，改了可以变
            this.defineReactive(data, key, data[key]);
            this.observe(data[key]);
        })
    }

    defineReactive(obj, key,value) {
        let that = this;
        // 这里创建发布订阅的对象
        // 每个变化的数据都会对应一个数组，这个数组是存放所有更新的操作
        let dep = new Dep();
        // 在获取某个值的时候，
        Object.defineProperty(obj,key,{
            enumerable:true, // 可以枚举
            configurable:true, // 可更改，如删除
            get() {
                // 把watcher加到dep里面
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set(newValue) {
                if (newValue !== value) {
                    // 当这里赋值对象的时候，同样需要劫持
                    that.observe(newValue);
                    value = newValue;
                    // 通知所有人数据更新了
                    dep.notify();
                }
            }
        })
    }
}

// 发布订阅来存放watcher和批量调用
class Dep {
    constructor(props) {
        this.subs = [];
    }
    addSub(watcher) {
        this.subs.push(watcher)
    }
    notify() {
        this.subs.forEach(watcher => watcher.update())
    }
}