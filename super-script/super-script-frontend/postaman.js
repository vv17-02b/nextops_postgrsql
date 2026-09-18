Ендпоінт: POST http://localhost:3000/api/order
{
    "userId": "64b0f19c9d4e2a1b3c4d5e6f",
        "totalAmount": 1500.50,
            "currency": "UAH",
                "shippingAddress": {
        "country": "Україна",
            "city": "Київ",
                "street": "Хрещатик, 1",
                    "zipCode": "01001"
    },
    "items": [
        {
            "productId": "64c123459d4e2a1b3c4d5e7a",
            "quantity": 2,
            "price": 500.00
        },
        {
            "productId": "64d543219d4e2a1b3c4d5e8b",
            "quantity": 1,
            "price": 500.50
        }
    ]
}

Ендпоінт: POST http://localhost:3000/api/orderitem
{
    "orderId": "6501a2b3c4d5e6f7a8b9c0d1",
        "productId": "64e987659d4e2a1b3c4d5e9c",
            "quantity": 1,
                "price": 250.00
}

Ендпоінт: PATCH http://localhost:3000/api/orderitem/ID_ЕЛЕМЕНТА_ЗАМОВЛЕННЯ
{
    "quantity": 3,
        "price": 230.00
}


login 
// [SUCCESS] Токен успішно перехоплено та збережено в localStorage!
// Статус: 201 OK | Час: 173ms
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWE4MTNkZWJkN2MzY2Y0Y2JmMTMxYmEiLCJlbWFpbCI6ImFkbWluMjAyNkBuZXh0b3BzLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc4OTQwNTU0MSwiZXhwIjoxNzkwMDEwMzQxfQ.fYbdXRYHt89-ut1jvDmRK8FAXSo7S22gCjJEM7uhQ-k",
  "user": {
    "id": "6aa813debd7c3cf4cbf131ba",
    "email": "admin2026@nextops.com",
    "role": "ADMIN"
  }
}