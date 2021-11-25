<template>
  <div>
    <canvas id="ruler-canvas" class="ruler-renderer" width="80" height="10"></canvas>
    <div class="ruler-text">{{(pixelDensity*this.bar_size).toFixed(2)}}µm</div>
  </div>
</template>

<script>
    import _ from "lodash"

    export default {
        name: "SliceViewerRuler",
        watch: {
            pixelDensity: {
                immediate: true,
                handler(new_value) {
                    // const max = (new_value * 80)
                    this.updateRuler()
                    // const desiredValue = max - ((max-10)%10)
                    // console.log("desired:", desiredValue)
                    // this.snapped_value = desiredValue
                    // this.bar_size = 100 - (((max-desiredValue)+desiredValue) % 100)
                    // this.bar_size = 100 - (max % 100)
                }
            },
            bar_size: function (new_value) {
                this.updateRuler()
            }
        },
        computed: {},
        data() {
            return {
                bar_size: 80,
            }
        },
        methods: {
            updateRuler: _.debounce(function () {
                if (this.ctx == null) return
                this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight)
                this.ctx.beginPath()
                this.ctx.moveTo(80, 5)
                this.ctx.lineTo(80-this.bar_size, 5)
                this.ctx.stroke()
                // this.ctx.fillText("50cm", 50, 10)
                this.ctx.beginPath()
                this.ctx.moveTo(80, 0)
                this.ctx.lineTo(80, 10)
                this.ctx.stroke()
                this.ctx.beginPath()
                this.ctx.moveTo(80-this.bar_size, 0)
                this.ctx.lineTo(80-this.bar_size, 10)
                this.ctx.stroke()
            },0)
        },
        mounted() {
            this.canvas = document.getElementById("ruler-canvas")
            this.ctx = this.canvas.getContext("2d")
            this.canvas.onwheel = (evt) => {
                const delta = evt.deltaY * -0.05
                this.bar_size = Math.max(Math.min(this.bar_size + delta, 80), 10)
            }
        },
        props: ["value", "pixelDensity"]
    }
</script>

<style scoped>
  .ruler-renderer {
    width: 100px;
    height: 10px;
    position: absolute;
    right: 8px;

  }

  .ruler-text {
    width: 100%;
    text-align: center;
    font-size: 12px;
    position: relative;
    right: 0;
    top: 10px;
  }
</style>