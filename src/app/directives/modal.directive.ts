import { Directive, ElementRef, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Directive({
  selector: '[appModal]',
  exportAs: 'modal'
})
export class ModalDirective {

  private static overlay: ElementRef;

  private static fillDefaults(obj, defaults) {
    const keys = Object.keys(defaults);
    for (let i = 0; i < keys.length; i++) {
      obj[keys[i]] = typeof defaults[keys[i]] === 'object' ?
        ModalDirective.fillDefaults(obj[keys[i]], defaults[keys[i]])
        : (!(keys[i] in obj) ? defaults[keys[i]] : obj[keys[i]]);
    }
    return obj;
  }

  constructor(private el: ElementRef, @Inject(DOCUMENT) private document: Document) {
  }

  public show() {
    this.handle('show');
  }

  public close() {
    this.handle('close');
  }

  public toggle() {
    this.handle('auto');
  }

  private getOverlay(): ElementRef {
    if (!ModalDirective.overlay) {
      const overlay = this.document.createElement('div');
      overlay.className = 'dialog-overlay';
      this.document.getElementsByClassName('window-content')[0].appendChild(overlay);
      ModalDirective.overlay = new ElementRef(overlay);
    }
    return ModalDirective.overlay;
  }

  private handle(action) {
    const dialog = this.el.nativeElement;
    const opts = ModalDirective.fillDefaults({action}, {
      action: 'auto',
      speed: 0.3
    });
    if (opts.action === 'auto') {
      opts.action = dialog.classList.contains('show') ? 'close' : 'open';
    }
    dialog.style.transitionDuration = opts.speed + 's';

    const overlay = this.getOverlay();

    if (opts.action === 'close') {
      dialog.classList.remove('show');
      overlay.nativeElement.classList.remove('show');
    } else {
      dialog.classList.add('show');
      overlay.nativeElement.classList.add('show');
    }
  }


}
