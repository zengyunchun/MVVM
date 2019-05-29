// 观察者的目的， 就是给需要变化的元素增加一个观察者，当数据变化的额时候执行对应的方法
class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        // 先获取以下老的值
        this.value = this.get();

    }

    getVal(vm,expr) {
        expr = expr.split('.');  // [a, b, c ,d]
        return expr.reduce((prev,next) => { // 一步一步取值
            return prev[next];
        },vm.$data)
    }

    get() {
        // 把当前的wather放到临时变量里
        Dep.target = this;
        // 这里调用的getVal的时候，会调用到劫持里的get() 函数，这个时候在那里在addSub
        let value = this.getVal(this.vm, this.expr);
        // 上一句增加完后，这里释放，以后就不会调用了
        Dep.target = null;
        return value;
    }

    // 对外暴露的方法，在对比新值和老值后调用此方法
    update(){
        let newValue = this.getVal(this.vm, this.expr);
        let oldValue = this.value;
        // 新值和老值不同则调用回调
        if (newValue != oldValue) {
            this.cb(newValue);
        }
    }
    
}