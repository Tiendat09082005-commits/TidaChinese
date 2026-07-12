# TidaChinese - Full-stack Node.js + React.js Skeleton

Dự án Boilerplate Full-stack Node.js và React.js được thiết kế với cấu trúc phân tách hoàn toàn giữa phân hệ **Admin** và **User**.

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend (`client/`)
- **Vite** & **React 18**
- **React Router v6** (Định tuyến & Bảo mật trang)
- **Axios** (Kết nối API)
- **TailwindCSS** (CSS Utility-first)

### Backend (`server/`)
- **Express.js** (REST API)
- **JSON Web Token (JWT)** (Xác thực người dùng)
- **CORS** & **Helmet** (Bảo mật HTTP headers)
- **Dotenv** (Quản lý biến môi trường)

---

## 📁 Cấu Trúc Dự Án

```text
TidaChinese/
├── client/                           # FRONTEND
│   ├── src/
│   │   ├── apps/                     # Chứa hai ứng dụng riêng biệt
│   │   │   ├── admin/                # Phân hệ Admin
│   │   │   │   ├── components/       # Layout, Sidebar, DataTable riêng biệt
│   │   │   │   ├── pages/            # Dashboard, User/Product/Order Management, Reports, Settings
│   │   │   │   ├── services/         # adminApi.js, userMgmtService.js...
│   │   │   │   ├── store/            # Quản lý state riêng cho Admin
│   │   │   │   └── routes/           # Định nghĩa routes admin (/admin/*)
│   │   │   │
│   │   │   └── user/                 # Phân hệ User (Khách hàng)
│   │   │       ├── components/       # Layout, Navbar, ProductCard riêng biệt
│   │   │       ├── pages/            # Home, Profile, Orders, Cart, ProductDetail
│   │   │       ├── services/         # userApi.js, productService.js...
│   │   │       ├── store/            # Quản lý giỏ hàng & state User
│   │   │       └── routes/           # Định nghĩa routes user (/*)
│   │   │
│   │   ├── auth/                     # Phân hệ xác thực & Route Guards
│   │   │   ├── pages/                # Login, Register, ForgotPassword
│   │   │   ├── services/             # authService.js
│   │   │   └── guards/               # AdminGuard, AuthGuard, GuestGuard
│   │   │
│   │   ├── shared/                   # Thành phần dùng chung toàn project
│   │   │   └── components/           # Button, Input, Modal rỗng
│   │   │
│   │   ├── routes/
│   │   │   └── index.jsx             # Cấu hình Router tổng của cả hệ thống
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── server/                           # BACKEND
    ├── src/
    │   ├── config/
    │   ├── modules/                  # Modular theo tính năng
    │   │   ├── admin/                # Admin APIs (Controllers, Services, Routes)
    │   │   ├── user/                 # User APIs
    │   │   ├── auth/                 # Authentication APIs
    │   │   └── shared/               # Code & Database Models dùng chung (Mock Models)
    │   │
    │   ├── middlewares/              # Global Middlewares (authenticate, errorHandler...)
    │   └── app.js                    # File khởi chạy Express server
    ├── .env.example
    ├── .env
    └── package.json
```

### 🔍 Chi Tiết Chức Năng Các Thư Mục Frontend (`client/src/`)

- **`apps/`**: Nơi chia nhỏ và chứa các phân hệ ứng dụng độc lập của dự án:
  - **`apps/admin/`**: Chứa toàn bộ logic và giao diện dành riêng cho Quản trị viên (Admin).
    - `components/`: Các UI chỉ dùng trong trang quản trị như Sidebar riêng, bảng dữ liệu DataTable.
    - `pages/`: Các trang chức năng của Admin (Tổng quan, Quản lý người dùng, Cài đặt...).
    - `services/`: Chứa `adminApi.js` cấu hình axios riêng và các hàm gọi API đến module admin của backend.
    - `store/`: Quản lý state Redux/Context riêng cho các dữ liệu quản trị (như danh sách thành viên, báo cáo).
    - `routes/`: Định nghĩa tập hợp các con đường dẫn (`adminRoutes.jsx`) của phân hệ Admin.
  - **`apps/user/`**: Chứa toàn bộ giao diện học tập và tương tác của Học viên (User).
    - `components/`: Các UI đặc trưng của User như Navbar, thẻ học từ vựng ProductCard.
    - `pages/`: Trang chủ học tập, Trang cá nhân, Giỏ hàng, Bảng giá...
    - `services/`: Chứa axios instance `userApi.js` cấu hình riêng và các lệnh gọi API liên quan tới khóa học, tiến độ của học viên.
    - `store/`: Quản lý state cục bộ cho học viên (như trạng thái giỏ hàng, thông tin bài học).
    - `routes/`: Định nghĩa tập hợp con các đường dẫn (`userRoutes.jsx`) của phân hệ User.
- **`auth/`**: Phân hệ quản lý luồng đăng nhập, đăng ký và bảo vệ tài nguyên:
  - `pages/`: Giao diện các trang xác thực (Đăng nhập, Đăng ký, Quên mật khẩu).
  - `guards/`: Chứa các bộ lọc bảo mật định tuyến quan trọng:
    - `AuthGuard.jsx`: Chỉ cho phép người dùng đã đăng nhập đi qua, nếu chưa sẽ đá về trang đăng nhập.
    - `GuestGuard.jsx`: Ngăn chặn người dùng đã đăng nhập truy cập lại trang Login/Register.
    - `AdminGuard.jsx`: Chặn đứng truy cập vào `/admin` nếu tài khoản không có vai trò Administrator.
  - `services/`: Các API liên quan tới Login, Register, Logout.
  - `store/`: Lưu trữ trạng thái đăng nhập, thông tin User hiện tại và mã Token JWT.
- **`shared/`**: Thư mục chứa các tài nguyên dùng chung cho cả 2 phân hệ Admin và User:
  - `components/`: Các UI components nguyên tử, có thể tái sử dụng ở bất kỳ đâu (như nút bấm `Button`, ô nhập liệu `Input`, hộp thoại `Modal`...).
  - `hooks/`: Các custom hooks dùng chung (như `useDebounce`, `useLocalStorage`...).
  - `utils/`: Các hàm trợ giúp xử lý dữ liệu chung (format định dạng ngày tháng, tiền tệ...).
  - `constants/`: Khai báo các hằng số hệ thống (vai trò người dùng ROLES, mã trạng thái STATUS, danh mục đường dẫn...).
- **`routes/`**: Chứa tệp cấu hình trung tâm **`index.jsx`** tập hợp tất cả các nhánh đường dẫn của hệ thống, thiết lập phân cấp và bọc các Layout bảo mật tương ứng.

---

## 🚀 Hướng Dẫn Cách Chạy Dự Án

### Yêu Cầu Hệ Thống
- Máy tính đã cài đặt **Node.js** (Phiên bản v18 trở lên được khuyến nghị)
- **NPM** hoặc **Yarn**

### Bước 1: Khởi động Backend Server
1. Di chuyển vào thư mục `server/`:
   ```bash
   cd server
   ```
2. Cài đặt các gói phụ thuộc (nếu chưa cài):
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` dựa theo file mẫu `.env.example`:
   ```bash
   PORT=5000
   JWT_SECRET=super_secret_key_123
   ```
4. Khởi chạy server ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   *Server sẽ hoạt động tại địa chỉ: `http://localhost:5000`*

### Bước 2: Khởi động Frontend Client
1. Di chuyển vào thư mục `client/`:
   ```bash
   cd ../client
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy client ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   *Vite dev server sẽ hoạt động, thông thường tại: `http://localhost:5173`*

---

## 🔄 Quy Trình & Luồng Hoạt Động Của Frontend (FE)

Luồng xử lý và cách thức phối hợp giữa các file của ứng dụng Client được vận hành theo các bước tuần tự như sau:

### 1. Khởi chạy & Tải Tài Nguyên (Bootstrap)
1. **`index.html`**: Trình duyệt tải tệp HTML đầu tiên. Tệp này nhúng trực tiếp tệp mã nguồn chính `src/main.jsx`.
2. **`src/main.jsx`**: Điểm nhập dữ liệu (Entry Point) của React. Nó khởi tạo gốc ứng dụng (React DOM root), đồng thời import tệp cấu hình CSS chung **`src/index.css`** (bao gồm Tailwind base utilities và định nghĩa keyframe cho hiệu ứng chuyển động). Sau đó, nó render component gốc **`src/App.jsx`**.

### 2. Định Tuyến & Bảo Mật (Routing & Guards)
1. **`src/App.jsx`**: Component này gọi và nhúng cấu hình bộ định tuyến **`src/routes/index.jsx`** thông qua `<RouterProvider router={router} />`.
2. **`src/routes/index.jsx`**: Cấu hình toàn bộ cấu trúc định tuyến (React Router DOM v6) chia làm 3 nhóm chính:
   - **Nhóm Public/Auth (`/auth/*`)**: Được bao bọc bởi **`GuestGuard.jsx`**. Luồng này kiểm tra nếu người dùng đã đăng nhập thì tự động chuyển hướng về trang chủ (`/`), ngược lại thì cho phép truy cập các trang [Đăng nhập](file:///c:/Project/TidaChinese/client/src/auth/pages/Login/Login.jsx) / [Đăng ký](file:///c:/Project/TidaChinese/client/src/auth/pages/Register/Register.jsx).
   - **Nhóm Khách hàng (`/` và các trang con)**: Được bảo vệ bởi **`AuthGuard.jsx`** (ngăn chặn nếu chưa đăng nhập) và hiển thị thông qua bộ khung chung **`UserLayout.jsx`**.
   - **Nhóm Quản trị (`/admin/*`)**: Được bảo vệ nghiêm ngặt bởi **`AdminGuard.jsx`** (chỉ cho phép quyền Admin) và hiển thị thông qua bộ khung chung **`AdminLayout.jsx`**.

### 3. Phân Phối Giao Diện & Bố Cục (Layout & Nested Routing)
1. **`UserLayout.jsx` / `AdminLayout.jsx`**: Đóng vai trò là các Layout cha bao bọc.
   - Khi truy cập một URL (ví dụ: `/pricing`), Router sẽ xác định layout phù hợp, kết xuất thanh đầu trang (Header), thanh bên trái (Sidebar) và truyền phần nội dung trang con tương ứng xuống thẻ định vị `<Outlet />`.
2. **`Outlet`**: Nơi các component con tương ứng với route hiện tại (như `Home.jsx`, `Pricing.jsx`, hay `Dashboard.jsx`) được render trực tiếp vào.

### 4. Kết Cấu Component Hóa & Gọi Dịch Vụ (Modularization & API)
1. **Các trang con (Pages)**: Được chia nhỏ thành các khối độc lập đặt trong thư mục `components/` kế cận để dễ kiểm tra lỗi (ví dụ: Trang chủ `Home/index.jsx` triệu gọi `Hero.jsx`, `QuickAccess.jsx`, `LearningTabs.jsx`...).
2. **Gọi API (`services/`)**: Các components gửi đi yêu cầu mạng thông qua cấu hình Axios được đóng gói tại các file Service (như `authService.js`, `productService.js`), giúp tách biệt logic nghiệp vụ khỏi giao diện hiển thị.
3. **Quản lý trạng thái (`store/`)**: Trạng thái dùng chung (như thông tin người dùng đăng nhập tại `authSlice.js`, giỏ hàng tại `cartSlice.js`) được cập nhật và lưu trữ tập trung.

