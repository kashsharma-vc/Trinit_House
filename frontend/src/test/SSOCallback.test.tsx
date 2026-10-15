import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SSOCallback from "../pages/SSOCallback";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SSOCallback Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("displays missing parameters error when code or state is missing", async () => {
    render(
      <MemoryRouter initialEntries={["/sso/callback"]}>
        <Routes>
          <Route path="/sso/callback" element={<SSOCallback />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/SSO Authentication Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing authorization code or state parameter/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Return to Login/i })).toBeInTheDocument();
  });

  it("shows loading state and completes successful SSO exchange with admin user", async () => {
    const fakeToken = "test-drf-token-999";
    const fakeUser = {
      id: 1,
      username: "admin_user",
      email: "admin@example.com",
      is_superuser: true,
      role: "Admin",
      zone_id: 1,
      zone_name: "Zone North",
      permissions: {},
    };

    // Mock global fetch
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: fakeToken,
        user: fakeUser,
      }),
    });
    global.fetch = fetchMock;

    render(
      <MemoryRouter initialEntries={["/sso/callback?code=valid_test_code_12345&state=valid_test_state_12345"]}>
        <Routes>
          <Route path="/sso/callback" element={<SSOCallback />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial loading indicator
    expect(screen.getByText(/Authenticating with VibeConnect/i)).toBeInTheDocument();

    await waitFor(() => {
      // Token and user stored in localStorage
      expect(localStorage.getItem("token")).toBe(fakeToken);
      expect(localStorage.getItem("user")).toBe(JSON.stringify(fakeUser));
      // Admin navigated to allowlisted /dashboard
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });

  it("redirects non-admin technician to allowlisted /technician/requests", async () => {
    const fakeToken = "tech-token-456";
    const fakeTechUser = {
      id: 2,
      username: "tech_user",
      email: "tech@example.com",
      is_superuser: false,
      role: "Technician",
      zone_id: 2,
      zone_name: "Zone South",
      permissions: {},
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: fakeToken,
        user: fakeTechUser,
      }),
    });

    render(
      <MemoryRouter initialEntries={["/sso/callback?code=tech_code_12345&state=tech_state_12345"]}>
        <Routes>
          <Route path="/sso/callback" element={<SSOCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/technician/requests", { replace: true });
    });
  });

  it("handles backend error response and provides return to login button", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: "Authorization code has already been redeemed or has expired.",
      }),
    });

    render(
      <MemoryRouter initialEntries={["/sso/callback?code=expired_code_12345&state=expired_state_12345"]}>
        <Routes>
          <Route path="/sso/callback" element={<SSOCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/SSO Authentication Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Authorization code has already been redeemed/i)).toBeInTheDocument();
    });

    const loginButton = screen.getByRole("button", { name: /Return to Login/i });
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});
