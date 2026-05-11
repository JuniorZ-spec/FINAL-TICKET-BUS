// __tests__/authMiddleware.test.js

const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");

// On dit à Jest : "ne pas vraiment appeler jwt,
// utilise un faux jwt à la place"
jest.mock("jsonwebtoken");

// Fonction utilitaire pour créer un faux req/res/next
// (car Express n'est pas là pendant les tests)
const mockReqResNext = (authHeader) => {
  const req = {
    headers: { authorization: authHeader },
  };
  const res = {
    status: jest.fn().mockReturnThis(), // permet d'enchaîner .status().json()
    json: jest.fn(),
  };
  const next = jest.fn(); // faux "next()" d'Express
  return { req, res, next };
};

// ─────────────────────────────────────────
// GROUPE 1 — Cas où ça doit échouer (401)
// ─────────────────────────────────────────
describe("authMiddleware", () => {
  test("❌ retourne 401 si pas de header authorization", () => {
    const { req, res, next } = mockReqResNext(undefined);

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Token manquant ou mal formé",
      })
    );
    expect(next).not.toHaveBeenCalled(); // next() ne doit PAS être appelé
  });

  test("❌ retourne 401 si le header ne commence pas par Bearer", () => {
    const { req, res, next } = mockReqResNext("Basic abc123");

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("❌ retourne 401 si le token JWT est invalide", () => {
    // On simule jwt.verify qui lance une erreur
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const { req, res, next } = mockReqResNext("Bearer tokeninvalide");

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Authentification échouée",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────
  // GROUPE 2 — Cas où ça doit réussir
  // ─────────────────────────────────────────

  test("✅ appelle next() et remplit req.user si token valide", () => {
    // On simule jwt.verify qui retourne un vrai payload
    jwt.verify.mockReturnValue({
      userId: "user-123",
      role: "traveler",
    });

    const { req, res, next } = mockReqResNext("Bearer tokenvalide");

    authMiddleware(req, res, next);

    // next() doit être appelé
    expect(next).toHaveBeenCalled();

    // req.user doit être rempli correctement
    expect(req.user).toEqual({
      userId: "user-123",
      role: "traveler",
    });

    // Aucune erreur retournée
    expect(res.status).not.toHaveBeenCalled();
  });
});
