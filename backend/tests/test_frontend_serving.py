from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

INDEX_HTML = "<!doctype html><title>PM_System</title>"


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    """An app serving a fake built frontend, with a file next to it that must stay private."""
    static = tmp_path / "static"
    (static / "assets").mkdir(parents=True)
    (static / "index.html").write_text(INDEX_HTML)
    (static / "favicon.svg").write_text("<svg/>")
    (static / "assets" / "index-abc123.js").write_text("console.log('app')")
    (tmp_path / "secret.txt").write_text("not for the browser")
    return TestClient(create_app(static_dir=static))


def test_root_serves_the_app(client: TestClient) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.text == INDEX_HTML
    assert response.headers["cache-control"] == "no-cache"


def test_client_routes_fall_back_to_the_app(client: TestClient) -> None:
    response = client.get("/queues/it")

    assert response.status_code == 200
    assert response.text == INDEX_HTML


def test_real_files_are_served(client: TestClient) -> None:
    response = client.get("/favicon.svg")

    assert response.status_code == 200
    assert response.text == "<svg/>"


def test_hashed_assets_are_cached_forever(client: TestClient) -> None:
    response = client.get("/assets/index-abc123.js")

    assert response.status_code == 200
    assert "immutable" in response.headers["cache-control"]


def test_missing_assets_are_404_not_the_app(client: TestClient) -> None:
    assert client.get("/assets/index-old999.js").status_code == 404


def test_unknown_api_paths_are_404_not_the_app(client: TestClient) -> None:
    for path in ("/api", "/api/", "/api/nope"):
        response = client.get(path)
        assert response.status_code == 404, path
        assert response.text != INDEX_HTML, path


def test_files_outside_the_frontend_folder_are_never_served(client: TestClient) -> None:
    for path in (
        "/../secret.txt",
        "/%2e%2e/secret.txt",
        "/..%2Fsecret.txt",
        "/assets/..%2F..%2Fsecret.txt",
    ):
        response = client.get(path)
        assert "not for the browser" not in response.text, path


def test_without_a_built_frontend_only_the_api_answers(tmp_path: Path) -> None:
    client = TestClient(create_app(static_dir=tmp_path / "missing"))

    assert client.get("/").status_code == 404
    assert client.get("/api/health").status_code == 200
