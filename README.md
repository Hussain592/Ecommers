# Dukaan.pk UI Kit

Bhai, main Dukaan.pk naam ka Pakistan-based multivendor COD ecommerce platform bana raha hoon.

Abhi mujhe SIRF FRONTEND/UI banana hai. Backend, Supabase database, authentication, RLS, API integration, WhatsApp automation, Telegram automation, payment gateway aur real data integration ABHI MAT BANANA. WhatsApp automation sabse last mein karenge.

Project Requirements

Dukaan.pk mein 4 portals honge:

Customer Website

Vendor Dashboard

Partner Dashboard

Admin/Owner Dashboard

Important

COD only

Customer ke liye guest checkout

Payment gateway nahi

Mobile responsive

Modern, professional ecommerce SaaS design

Next.js frontend structure use karo

Supabase ko abhi connect mat karo

Dummy/mock data use karo

WhatsApp/Telegram ka koi implementation abhi mat karo

Har portal ka UI clearly separate ho

Customer Website

Frontend mein ye pages banao:

Homepage

Products listing

Product detail

Services listing

Service detail

Cart

COD checkout

Order confirmation

Track order

Homepage mein customer ko Admin Dashboard ka button nahi dikhna chahiye.

Vendor Dashboard

Vendor ke liye:

Dashboard overview

Products

Add Product

Edit Product

Orders

Earnings

Commissions

Partners

Settings

Products page mein:

Product image

Product name

Category

Price

Stock

Active/Inactive status

Edit

Delete

Search

Filter

Add New Product

Partner Dashboard

Partner ko limited UI do:

Dashboard

Add Product

Products

Stock Update

Profile

Partner ko:

Earnings

Commission

Payouts

Financial information

NAHI dikhani.

Admin/Owner Dashboard

Admin ke liye:

Overview

Vendors

Orders

Commissions

Payouts

Categories

Partners/Users

Settings

Admin sab vendors ka data frontend mockup mein dekh sakta hai.

Login / Role Flow

Frontend mein role-based UI ka demo banao:

Customer → Customer area

Vendor → Vendor Dashboard

Partner → Partner Dashboard

Admin/Owner → Admin Dashboard

Admin Dashboard homepage par publicly visible nahi hona chahiye.

Admin ke liye separate frontend route rakho:

/admin

Abhi sirf mock Admin Login UI banao. Real authentication baad mein Supabase se connect karenge.

Design Direction

Dukaan.pk ko modern Pakistani ecommerce platform jaisa professional look do.

Use:

Clean white/light background

Blue primary accent

Rounded cards

Soft shadows

Professional typography

Responsive sidebar dashboards

Mobile responsive layouts

Proper empty states

Loading states

Buttons, forms, tables and modals

Consistent design system

Jo UI images/reference designs maine conversation mein diye hain, unke visual direction ko follow karo, lekin layout ko clean aur production-quality rakho.

MOST IMPORTANT

Abhi sirf frontend complete karo.

DO NOT:

Supabase connect karna

Database banana

RLS banana

Authentication implement karna

WhatsApp automation banana

Telegram automation banana

Payment gateway banana

Real API banana

Service role key use karna

Dummy/mock data se complete frontend experience dikhao.

Project ko aise structure karo ke baad mein Supabase backend easily connect kiya ja sake.

Aur WhatsApp automation ko bilkul touch mat karna — woh project ke end mein karenge.

Kaam step-by-step karo aur pehle frontend pages/components ka structure banao, phir UI implement karo.
or ha bhai mana jo tumsa ya sara share keya muja ya sara kam karta howa chaiya jama gaya na ak ak section kam karna chaiya ok

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e83497e6-392f-4ad5-b3d4-190201e94c80).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
