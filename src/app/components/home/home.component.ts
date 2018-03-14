import { Component, OnInit, HostBinding, OnDestroy } from '@angular/core';
import { DataService } from '../../providers/data.service';
import { PartialObserver } from 'rxjs/Observer';
import { Subscription } from 'rxjs/Subscription';
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

  private ckEditor: any;
  private resetEditorUndo = false;

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

  public editorConfig = {
    customConfig: '',
    toolbarGroups: [
      {name: 'clipboard', groups: ['clipboard', 'undo']},
      {name: 'editing', groups: ['find', 'selection', 'spellchecker', 'editing']},
      {name: 'forms', groups: ['forms']},
      {name: 'styles', groups: ['styles']},
      {name: 'document', groups: ['mode', 'document', 'doctools']},
      '/',
      {name: 'basicstyles', groups: ['basicstyles', 'cleanup']},
      {name: 'colors', groups: ['colors']},
      {name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi', 'paragraph']},
      {name: 'links', groups: ['links']},
      {name: 'insert', groups: ['insert']},
      {name: 'tools', groups: ['tools']},
      {name: 'others', groups: ['others']},
      {name: 'about', groups: ['about']}
    ],
    removeButtons: 'Cut,Copy,Paste,Anchor,DocProps,Superscript,Subscript',

    // Dialog windows are also simplified.
    removeDialogTabs: 'link:advanced'
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
    if (this.ckEditor) {
      if (this.ckEditor.undoManager.undoable()) {
        // TODO Maybe show a dialog first to ask whether the user want's to change the signature despite the performed changes
      }
      // console.log('signature selected');
      this.resetEditorUndo = true;
    }
  }

  onReady(event) {
    this.ckEditor = event.editor;
  }

  onChange(event) {
    // console.log('onchange called with ' + this.resetEditorUndo + ' and ' + event);
    if (this.resetEditorUndo) {
      this.ckEditor.resetUndo();
      this.resetEditorUndo = false;
    }
  }

  public previewContent(content: string) {
    return content.replace(/<\//g, ' </');
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
