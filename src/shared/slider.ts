import { css, CSSResultGroup, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import "hammerjs";

const getPercentageFromEvent = (e: HammerInput) => {
    const x = e.center.x;
    const offset = e.target.getBoundingClientRect().left;
    const total = e.target.clientWidth;
    return Math.max(Math.min(1, (x - offset) / total), 0);
};

@customElement("mushroom-slider")
export class SliderItem extends LitElement {
    @property() public disabled: boolean = false;

    @property({ type: Boolean, attribute: "show-active" })
    public showActive?: boolean;

    @property({ type: Boolean, attribute: "show-indicator" })
    public showIndicator?: boolean;

    @property({ attribute: false, type: Number, reflect: true })
    public value?: number;

    @property({ type: Number })
    public min: number = 0;

    @property({ type: Number })
    public max: number = 100;

    private _mc?: HammerManager;

    valueToPercentage(value: number) {
        return (value - this.min) / (this.max - this.min);
    }

    percentageToValue(value: number) {
        return (this.max - this.min) * value + this.min;
    }

    protected firstUpdated(changedProperties: PropertyValues): void {
        super.firstUpdated(changedProperties);
        this.setupListeners();
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.setupListeners();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.destroyListeners();
    }

    @query("#slider")
    private slider;

    setupListeners() {
        if (this.slider && !this._mc) {
            this._mc = new Hammer.Manager(this.slider, { touchAction: "pan-y" });
            this._mc.add(
                new Hammer.Pan({
                    threshold: 10,
                    direction: Hammer.DIRECTION_ALL,
                    enable: true,
                })
            );

            this._mc.add(new Hammer.Tap({ event: "singletap" }));

            let savedValue;
            this._mc.on("panstart", () => {
                savedValue = this.value;
            });
            this._mc.on("pancancel", () => {
                this.value = savedValue;
            });
            this._mc.on("panmove", (e) => {
                const percentage = getPercentageFromEvent(e);
                this.value = this.percentageToValue(percentage);
                this.dispatchEvent(
                    new CustomEvent("current-change", {
                        detail: {
                            value: Math.round(this.value),
                        },
                    })
                );
            });
            this._mc.on("panend", (e) => {
                const percentage = getPercentageFromEvent(e);
                this.value = this.percentageToValue(percentage);
                this.dispatchEvent(
                    new CustomEvent("current-change", {
                        detail: {
                            value: undefined,
                        },
                    })
                );
                this.dispatchEvent(
                    new CustomEvent("change", {
                        detail: {
                            value: Math.round(this.value),
                        },
                    })
                );
            });

            this._mc.on("singletap", (e) => {
                const percentage = getPercentageFromEvent(e);
                this.value = this.percentageToValue(percentage);
                this.dispatchEvent(
                    new CustomEvent("change", {
                        detail: {
                            value: Math.round(this.value),
                        },
                    })
                );
            });
        }
    }

    destroyListeners() {
        if (this._mc) {
            this._mc.destroy();
            this._mc = undefined;
        }
    }

    protected render(): TemplateResult {
        return html`
            <div class=${classMap({ container: true, disabled: this.disabled })}>
                <div
                    id="slider"
                    class="slider"
                    style=${styleMap({
                        "--value": `${this.valueToPercentage(this.value ?? 0)}`,
                    })}
                >
                    <div class="slider-track-background"></div>
                    ${this.showActive ? html`<div class="slider-track-active"></div>` : null}
                    ${this.showIndicator ? html`<div class="slider-track-indicator"></div>` : null}
                </div>
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return css`
            :host {
                --main-color: rgba(var(--rgb-secondary-text-color), 1);
                --bg-gradient: none;
                --bg-color: rgba(var(--rgb-secondary-text-color), 0.2);
                --main-color-disabled: var(--disabled-text-color);
                --bg-color-disabled: rgba(var(--rgb-primary-text-color), 0.05);
            }
            .container {
                display: flex;
                flex-direction: row;
                height: 42px;
            }
            .container > *:not(:last-child) {
                margin-right: var(--spacing);
            }
            .slider {
                position: relative;
                height: 100%;
                width: 100%;
                border-radius: var(--control-border-radius);
                transform: translateZ(0);
                overflow: hidden;
                cursor: pointer;
            }
            .slider * {
                pointer-events: none;
            }
            .slider .slider-track-background {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
                background-color: var(--bg-color);
                background-image: var(--gradient);
            }
            .slider .slider-track-active {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
                transform: scale3d(var(--value, 0), 1, 1);
                transform-origin: left;
                background-color: var(--main-color);
            }
            .slider .slider-track-indicator {
                position: absolute;
                top: 0;
                bottom: 0;
                left: calc(var(--value, 0) * (100% - 10px));
                width: 10px;
                border-radius: 3px;
                background-color: white;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
            }
            .slider .slider-track-indicator:after {
                display: block;
                content: "";
                background-color: var(--main-color);
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                margin: auto;
                height: 20px;
                width: 2px;
                border-radius: 1px;
            }
            .disabled .slider .slider-track-background {
                background-color: var(--bg-color-disabled);
                background-image: none;
            }
            .disabled .slider .slider-track-indicator:after {
                background-color: var(--main-color-disabled);
            }
            .disabled .slider .slider-track-active {
                background-color: var(--main-color-disabled);
            }
        `;
    }
}
