from app.routes.subscriptions import payment_refusal

STUDENT_WITH_CARD = {
    "role": "ACHETEUR",
    "is_active": True,
    "phone": "+22890000000",
    "student_id_url": "uuid/carte.jpg",
    "account_type": "etudiant",
    "verification_status": "pending",
}


def test_student_who_sent_card_can_pay():
    assert payment_refusal(STUDENT_WITH_CARD) is None


def test_student_without_card_is_refused():
    profile = {**STUDENT_WITH_CARD, "student_id_url": None}
    assert "carte d'étudiant" in payment_refusal(profile)


def test_named_admin_without_card_can_pay():
    profile = {**STUDENT_WITH_CARD, "student_id_url": None}
    assert payment_refusal(profile, is_named_admin=True) is None


def test_staff_must_be_approved():
    staff = {**STUDENT_WITH_CARD, "student_id_url": None, "account_type": "personnel"}
    assert "profession" in payment_refusal({**staff, "verification_status": "pending"})
    assert payment_refusal({**staff, "verification_status": "approved"}) is None


def test_suspended_account_is_refused_even_for_renewal():
    profile = {**STUDENT_WITH_CARD, "role": "VENDEUR", "is_active": False}
    assert "suspendu" in payment_refusal(profile)


def test_phone_is_required():
    assert "WhatsApp" in payment_refusal({**STUDENT_WITH_CARD, "phone": "  "})


def test_vendor_renewal_is_allowed():
    profile = {**STUDENT_WITH_CARD, "role": "VENDEUR", "student_id_url": None}
    assert payment_refusal(profile) is None


def test_missing_profile_is_refused():
    assert "Profil introuvable" in payment_refusal({})
    assert "Profil introuvable" in payment_refusal(None)
