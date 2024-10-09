CREATE TABLE Users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Concerts (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    concert_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Seats (
    id UUID PRIMARY KEY,
    concert_id UUID REFERENCES Concerts(id),
    seat_number INT NOT NULL CHECK (seat_number >= 1 AND seat_number <= 50),
    status VARCHAR(20) DEFAULT 'available', -- available, reserved_temp, reserved_final
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    UNIQUE (concert_id, seat_number)
);

CREATE TABLE Queue (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES Users(id),
    concert_id UUID REFERENCES Concerts(id),
    queue_position INT NOT NULL,
    wait_time VARCHAR(50), -- 대기 시간, 예: "10 minutes"
    token VARCHAR(255) UNIQUE, -- JWT 토큰
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    UNIQUE (user_id, concert_id)
);

CREATE TABLE Reservations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES Users(id),
    concert_id UUID REFERENCES Concerts(id),
    seat_id UUID REFERENCES Seats(id) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, canceled
    amount DECIMAL(10, 2) NOT NULL,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_deadline TIMESTAMP, -- 결제 마감 시간 (예: 예약 후 5분)
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Payments (
    id UUID PRIMARY KEY,
    reservation_id UUID REFERENCES Reservations(id),
    user_id UUID REFERENCES Users(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed
    payment_method VARCHAR(50) NOT NULL, -- 예: 'credit_card', 'paypal'
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
