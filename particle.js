(function () {
    _ = window._ || {};

    _.getRandom = function (a, b) {
        var t = Math.random();
        return a * t + b * (1 - t);
    };
})();

(function() {
    var cWidth, cHeight;
    var dt = 0.5;
    
    //坐标系 右下正方向
    var Vector2 = function (x, y) {
        this.x = x;
        this.y = y;
    };
    Vector2.prototype.add = function (v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    };
    Vector2.prototype.multi = function (c) {
        return new Vector2(this.x * c, this.y * c);
    };
    //色彩
    var Color = function (r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    };
    Color.prototype.shake = function (c) {
        var color = new Color(this.r, this.g, this.b);
        color[c] = Math.min(Math.max(Math.floor(this[c] + _.getRandom(-30, 30)), 0), 255);
        return color;
    }

    //粒子
    var Particle = function (options) {
        this.position = options.position;
        this.speed = options.speed || new Vector2(0, 0);
        this.accelerate = options.accelerate || new Vector2(0, 0);
        this.color = options.color;
        this.life = options.life;
        this.age = 0;
    };
    Particle.prototype.step = function () {
        this.speed = this.speed.add(this.accelerate);
        this.position = this.position.add(this.speed);
    };
    Particle.prototype.aging = function () {
        this.age += dt;
    };
    //粒子系统
    var ParticleSystem = function (options) {
        this.particles = [];
        this.init();
        this.grow();
    };
    ParticleSystem.prototype.init = function () {
        setInterval(function () {
            this.particles.push(new Particle());
        }.bind(this), 150);
    };
    ParticleSystem.prototype.grow = function () {
        setInterval(function () {
            for (var i = 0; i < this.particles.length; i++) {
                var p = this.particles[i];
                p.aging();

                if (p.age >= p.life) {
                    this.particles[i] = this.particles[this.particles.length - 1];
                    this.particles.pop();
                    i--;
                } else {
                    p.step();
                }
            }
        }.bind(this), 50);
    };
    ParticleSystem.prototype.render = function (ctx) {
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            p.paint(ctx);
        }
    };


    //焰火粒子
    var FrwParticle = function (options) {
        Particle.call(this, options);
        this.color = options.color;
    };
    FrwParticle.prototype = Object.create(Particle.prototype);
    FrwParticle.prototype.paint = function (ctx) {
        ctx.fillStyle = 'rgb(' + this.color.r + ',' + this.color.g + ',' + this.color.b + ')';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    //焰火
    var Firework = function (options) {
        this.position = options.position;
        this.color = options.color;
        ParticleSystem.call(this, options);
    };
    Firework.prototype = Object.create(ParticleSystem.prototype);
    Firework.prototype.getDirection = function () {
        var t = _.getRandom(0, Math.PI * 2);
        return new Vector2(Math.cos(t), Math.sin(t));
    };
    Firework.prototype.init = function () {
        setInterval(function () {
            this.particles.push(new FrwParticle({
                position: new Vector2(this.position.x, this.position.y),
                speed: this.getDirection().multi(2.5),
                accelerate: new Vector2(0, 0.03),
                life: _.getRandom(20, 35), 
                color: this.color.shake('g')
            }));
        }.bind(this), 50);
    };


    //雪花粒子
    var SnowParticle = function (options) {
        Particle.call(this, options);
        this.color = 'rgba(255, 255, 255, 1)';
        this.r = options.r;
    };
    SnowParticle.prototype = Object.create(Particle.prototype);
    SnowParticle.prototype.paint = function (ctx) {
        var grd = ctx.createRadialGradient(this.position.x, this.position.y, 1, this.position.x, this.position.y, this.r);
        grd.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
    };

    //雪花
    var Snow = function (options) {
        ParticleSystem.call(this, options);
    };
    Snow.prototype = Object.create(ParticleSystem.prototype);
    Snow.prototype.init = function () {
        setInterval(function () {
            this.particles.push(new SnowParticle({
                position: new Vector2(_.getRandom(0, cWidth), _.getRandom(0, 30)),
                accelerate: new Vector2(_.getRandom(-0.05, 0.05), _.getRandom(0.01, 0.1)),
                life: _.getRandom(60, 80),
                r: setRadius()
            }));
        }.bind(this), 150);

        function setRadius () {
            if (Math.random() > 0.95) {
                return _.getRandom(8, 9);
            } else {
                return _.getRandom(1, 6);
            }
        }
    };


    document.addEventListener('DOMContentLoaded', function () {
        var sCanvas = document.getElementById('snow');
        var sCtx = sCanvas.getContext('2d');
        var fCanvas = document.getElementById('fireworks');
        var fCtx = fCanvas.getContext('2d');
        cWidth = sCanvas.offsetWidth;
        cHeight = sCanvas.offsetHeight;

        //创建雪花
        var snow = new Snow({ctx: sCtx});
        // 创建烟花
        var fireworks = [];
        fireworks.push(new Firework({
            position: new Vector2(400, cHeight - 250),
            ctx: fCtx,
            color: new Color(145, 88, 88)
        }));
        fireworks.push(new Firework({
            position: new Vector2(200, cHeight - 150),
            ctx: fCtx,
            color: new Color(145, 188, 88)
        }));

        function step () {
            fCtx.fillStyle = 'rgb(0, 0, 0, 0.1)';
            fCtx.fillRect(0, 0, cWidth, cHeight);
            for (var i = 0; i < fireworks.length; i++) {
                fireworks[i].render(fCtx);
            }

            sCtx.clearRect(0, 0, cWidth, cHeight);
            snow.render(sCtx);

            window.requestAnimationFrame(step);
        }

        window.requestAnimationFrame(step);
    });
})();