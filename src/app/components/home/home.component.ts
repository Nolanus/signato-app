import { Component, OnInit, HostBinding, OnDestroy } from '@angular/core';
import { DataService } from '../../providers/data.service';
import { Subscription, PartialObserver } from 'rxjs';
import Signature from '../../../../main/signature';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @HostBinding('class.window-content') windowContentBinding = true;

  public signatures: Signature[] = [];
  public signature: Signature;
  public showMore = false;

  private subscriptions: Subscription[] = [];

  private handleSignatures: PartialObserver<Signature[]> = {
    next: (data) => {
      this.signatures = data;
      if (this.signature) {
        // Update the selected signature object instance
        this.signature = this.signatures.find(signature => signature.signatureUniqueId === this.signature.signatureUniqueId);
      }
    },
    error: (err) => console.error(err)
  };

  constructor(public dataService: DataService) {
  }

  ngOnInit() {
    this.subscriptions.push(this.dataService.signatures.subscribe(this.handleSignatures));
    this.dataService.loadSignatures();
  }

  ngOnDestroy(): void {
    // Unregister the listeners
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  selectSignature(signature: Signature) {
    this.signature = signature;
  }

  public previewContent(content: string) {
    return content.replace(/<\//g, ' </');
  }

  public previewSignature() {
    this.dataService.previewSignature(this.signature);
  }

  public save() {
    this.dataService.saveSignature(this.signature);
  }

  public reloadSignatures() {
    this.dataService.loadSignatures();
  }

  public changeSignatureFileLock(event: MouseEvent, signature: Signature) {
    if (event.altKey) {
      this.dataService.changeSignatureFileLock(signature);
    }
  }
}
