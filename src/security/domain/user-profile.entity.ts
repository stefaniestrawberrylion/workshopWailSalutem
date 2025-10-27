export class UserProfile {
  readonly username: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;

  constructor(
    username: string,
    email: string,
    firstName: string,
    lastName: string,
  ) {
    this.username = username;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  getUsername(): string {
    return this.username;
  }

  getEmail(): string {
    return this.email;
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }
}
