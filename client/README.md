# NHSign

## Install

[Watch this quick video to setup this project](https://youtu.be/R5zBs28_TVQ).

```
npm install
```

## Run

```
npm run client
```

## Project structure

```
src/
  app/             - Redux Store Configuration
  components/      - React components
    Assign/              - Add users to a document that needs to be signed 
    Lists/               - List components to list files for signing and review
    MergeAnnotations/    - Merge all signatures and flatten them onto a PDF 
    PasswordReset/       - Reset password
    PrepareDocument/     - Drag and drop signatures, text fields onto a PDF to prepare it for signing
    Profile/             - Profile information and a sign out button
    SignDocument/        - Sign PDF
    SignIn/              - Sign in
    SignUp/              - Sign up
    ViewDocument/        - Review document after signing
    AssignUsers          - Component combines Profile and Assign
    Header               - Header when the user is not logged in
    Preparation          - Component combines Profile and PrepareDocument
    Sign                 - Component combines Profile and SignDocument
    View                 - Component combines Profile and ViewDocument
    Welcome              - Component combines Profile, SignList, Preparation, SignedList
  App              - Configuration for navigation, authentication
  index            - Entry point and configuration for React-Redux
  firebase/        - Firebase configuration for authentication, updating documents, storing PDFs
  tools/           - Helper function to copy over PDFTron dependencies into /public on post-install
```

## Document Structure

```
docRef: docToSign/c4Y72M0d0pZx3476jxJFxrFA3Qo21593036106369.pdf"
email: "andrey@email.com"
emails: ["julia@email.com"]
signed: true
signedBy: ["julia@email.com"]
requestedTime: July 17, 2020 at 12:01:24 PM UTC-7
signedTime: July 17, 2020 at 12:01:24 PM UTC-7
uid: "c4Y72M0d0pZx3476jxJFxrFA3Qo2"
xfdf: ["<?xml version="1.0" encoding="UTF-8" ?><xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">...</xfdf>"]
 ```
 
- docRef - string - storage reference to the actual PDF
- email - string - email of the requestor of the signature
- emails - an array of strings - users to sign the document
- signed - boolean - value for whether or not all users have signed the document (gets determined by checking lengths of emails array and xfdf array)
- requestedTime - TimeStamp - value for when the signature was requested
- signedTime - TimeStamp - value for when the document was signed
- uid - string - unique identifier for the requestor of the signature
- xfdf - an array of strings - signature appearance/form field values for each user

## API documentation
See [API documentation](https://www.pdftron.com/documentation/web/guides/ui/apis).

## License
