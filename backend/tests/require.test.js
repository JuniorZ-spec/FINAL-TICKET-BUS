// __tests__/requireRole.test.js

const requireRole = require("../middlewares/requireRole");

const mockReqResNext = (user) => {
  const req = { user }; // req.user injecté par authMiddleware avant
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const next = jest.fn();
  return { req, res, next };
};

describe("requireRole", () => {
  test("❌ retourne 401 si req.user est absent", () => {
    const { req, res, next } = mockReqResNext(undefined);
    const middleware = requireRole("admin");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Non authentifié",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("❌ retourne 403 si le rôle ne correspond pas", () => {
    // Un traveler essaie d'accéder à une route admin
    const { req, res, next } = mockReqResNext({ userId: "123", role: "traveler" });
    const middleware = requireRole("admin");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Accès refusé",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("✅ appelle next() si le rôle est admin et requis admin", () => {
    const { req, res, next } = mockReqResNext({ userId: "123", role: "admin" });
    const middleware = requireRole("admin");

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("✅ appelle next() si plusieurs rôles acceptés", () => {
    // La route accepte admin OU company
    const { req, res, next } = mockReqResNext({ userId: "456", role: "company" });
    const middleware = requireRole("admin", "company");

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
