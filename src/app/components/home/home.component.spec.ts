import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgStringPipesModule } from 'angular-pipes';
import { FormsModule } from '@angular/forms';

import { HomeComponent } from './home.component';
import { ElectronService } from '../../providers/electron.service';
import { DataService } from '../../providers/data.service';
import { TranslateModule } from '@ngx-translate/core';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        NgStringPipesModule,
        TranslateModule.forRoot()
      ],
      providers: [
        ElectronService,
        DataService
      ],
      declarations: [HomeComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create a component', () => {
    expect(component).toBeTruthy();
  });

  it('display signatures in the list', async(() => {
    fixture.detectChanges();
    const comp = fixture.debugElement.componentInstance;
    const compiled = fixture.debugElement.nativeElement;

    expect(compiled.querySelector('h5.nav-group-title').textContent).toBe('PAGES.HOME.SIGNATURES (0)');

    // Trigger a data submission
    comp.dataService.signatures.next([{signatureName: 'Test', content: '123412341234'}]);

    fixture.detectChanges();

    expect(compiled.querySelector('h5.nav-group-title').textContent).toBe('PAGES.HOME.SIGNATURES (1)');
  }));

  it('display a selected signature on the main area and reflect changes', async(() => {
    const demoSignatures = [{
      signatureName: 'Test',
      content: '123412341234',
      type: 0,
      _fileLocked: false,
      accountURLs: [],
      signatureUniqueId: 'uniqueId',
      messageId: 'messageId',
      mimeVersion: 'mimeVersion'
    }];
    const comp = fixture.debugElement.componentInstance;
    const compiled = fixture.debugElement.nativeElement;
    fixture.detectChanges();
    comp.dataService.signatures.next(demoSignatures);
    fixture.detectChanges();
    expect(compiled.querySelector('h4').textContent).toBe('Apple Mail HTML signatures made simple');
    expect(compiled.querySelector('h5.nav-group-title').textContent).toBe('PAGES.HOME.SIGNATURES (1)');
    const listItems = compiled.querySelectorAll('li.list-group-item');
    expect(listItems.length).toBe(1);
    listItems[0].click();
    expect(comp.signature).toBe(demoSignatures[0]);
    fixture.detectChanges();
    expect(compiled.querySelector('li.list-group-item').classList).toContain('active');
    const detailIcons = compiled.querySelectorAll('.description-paragraph span.icon');
    expect(detailIcons[0].classList).toContain('icon-drive');
    expect(detailIcons[1].classList).toContain('icon-lock-open');
    demoSignatures[0]._fileLocked = true;
    demoSignatures[0].type = 1;
    fixture.detectChanges();
    expect(detailIcons[0].classList).toContain('icon-cloud');
    expect(detailIcons[1].classList).toContain('icon-lock');
  }));
});
