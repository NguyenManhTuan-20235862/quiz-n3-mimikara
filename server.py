#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Máy chủ phát web Quiz N3 phục vụ học tập qua điện thoại cùng mạng Wi-Fi
"""
import os
import sys
import socket
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 5500

def get_local_ip():
    """Tự động tìm địa chỉ IP mạng nội bộ (Wi-Fi/LAN) của máy tính"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Kết nối tới một IP bên ngoài để xác định card mạng đang truy cập
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        try:
            ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Thiết lập header tránh cache dữ liệu cũ
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(current_dir)
    
    local_ip = get_local_ip()
    phone_url = f"http://{local_ip}:{PORT}"
    connect_url = f"http://localhost:{PORT}/connect.html?ip={local_ip}&port={PORT}"

    print("\n" + "=" * 66)
    print("   📱 WEB QUIZ TỪ VỰNG N3 - MÁY CHỦ HỌC TRÊN ĐIỆN THOẠI")
    print("=" * 66)
    print(f"\n[1] TRÊN ĐIỆN THOẠI (kết nối cùng Wi-Fi với laptop này):")
    print(f"    👉 Nhập địa chỉ: {phone_url}")
    print(f"    👉 Hoặc quét mã QR trên trang hướng dẫn đang mở trên máy tính!")
    print(f"\n[2] TRÊN LAPTOP / MÁY TÍNH:")
    print(f"    👉 Địa chỉ: http://localhost:{PORT}")
    print("\n" + "=" * 66)
    print("💡 Giữ cửa sổ dòng lệnh này mở trong suốt lúc bạn học.")
    print("   Để tắt máy chủ, chỉ cần đóng cửa sổ này hoặc nhấn phím Ctrl + C.")
    print("=" * 66 + "\n")

    # Tự động mở trang quét QR trên trình duyệt máy tính
    try:
        webbrowser.open(connect_url)
    except Exception:
        pass

    try:
        server = HTTPServer(('0.0.0.0', PORT), CustomHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng máy chủ thành công.")
        sys.exit(0)

if __name__ == '__main__':
    main()
