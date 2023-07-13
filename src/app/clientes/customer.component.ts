import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

import { Customer } from './customer';

class EmailMatcher {
  static match(c: AbstractControl): { [key: string]: boolean } | null {
    const emailControl = c.get('email');
    const confirmControl = c.get('confirmEmail');

    if (emailControl && confirmControl && (emailControl.pristine || confirmControl.pristine)) {
      return null;
    }

    if (emailControl && confirmControl && emailControl.value === confirmControl.value) {
      return null;
    }

    return { match: true };
  }
}

class RatingRangeValidator {
  static range(min: number, max: number): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
      if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
        return { range: true };
      }
      return null;
    };
  }
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup;
  emailMessage: string = '';

  get addresses(): FormArray {
    return this.customerForm.get('addresses') as FormArray;
  }

  validationMessages = {
    required: 'Por favor ingrese su email',
    email: 'Por favor ingrese un correo electrónico válido'
  };

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', Validators.required],
      }, { validator: EmailMatcher.match }),
      phone: '',
      notification: 'email',
      addresses: this.fb.array([this.buildAddress()])
    });

    this.customerForm.get('notification')?.valueChanges.subscribe(
      value => this.setNotification(value)
    );

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.setMessage(emailControl)
    );
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: ['', Validators.required],
      street2: '',
      city: '',
      state: '',
      zip: ''
    });
  }

  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: 'Juan',
      lastName: 'Perez',
      emailGroup: { email: 'juan@mail.com', confirmEmail: 'juan@mail.com' }
    });

    const addressGroup = this.fb.group({
      addressType: 'work',
      street1: 'Calle República',
      street2: '',
      city: 'Ciudad de Córdoba',
      state: 'CBA',
      zip: '123'
    });

    this.customerForm.setControl('addresses', this.fb.array([addressGroup]));
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(
        key => this.validationMessages[key]).join(' ');
    }
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl?.setValidators(Validators.required);
    } else {
      phoneControl?.clearValidators();
    }
    phoneControl?.updateValueAndValidity();
  }
}
